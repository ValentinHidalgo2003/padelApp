from decimal import Decimal
from datetime import date, time, timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Booking, BookingClosure, CancellationToken
from .services import BookingService
from apps.courts.models import Court, TimeSlotConfiguration

User = get_user_model()


# =============================================================================
# Helpers
# =============================================================================

def future_date(days=7):
    """Return a date in the future."""
    return date.today() + timedelta(days=days)


class BaseBookingTestCase(TestCase):
    """Base class with common setup for booking tests."""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin', password='admin123', role='admin'
        )
        self.reception = User.objects.create_user(
            username='recep', password='recep123', role='reception'
        )
        self.court = Court.objects.create(
            name='Cancha 1', court_type='indoor', price=24000, is_active=True
        )
        self.court2 = Court.objects.create(
            name='Cancha 2', court_type='outdoor', price=24000, is_active=True
        )
        self.config = TimeSlotConfiguration.get_active()


# =============================================================================
# Model Tests
# =============================================================================

class BookingModelTest(BaseBookingTestCase):
    """Tests para el modelo Booking"""

    def test_create_booking(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Juan',
            customer_phone='1122334455',
        )
        self.assertEqual(booking.status, 'reserved')
        self.assertEqual(booking.duration_minutes, 90)

    def test_booking_str(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test',
        )
        self.assertIn('Cancha 1', str(booking))

    def test_can_be_cancelled_reserved(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test',
        )
        self.assertTrue(booking.can_be_cancelled)

    def test_cannot_cancel_completed(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='completed',
            customer_name='Test',
        )
        self.assertFalse(booking.can_be_cancelled)

    def test_can_be_closed_only_reserved(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test',
        )
        self.assertTrue(booking.can_be_closed)

    def test_unique_together_court_date_time(self):
        Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test1',
        )
        with self.assertRaises(Exception):
            Booking.objects.create(
                court=self.court,
                date=future_date(),
                start_time=time(10, 0),
                end_time=time(11, 30),
                status='reserved',
                customer_name='Test2',
            )

    def test_end_time_must_be_after_start_time(self):
        with self.assertRaises(Exception):
            Booking.objects.create(
                court=self.court,
                date=future_date(),
                start_time=time(11, 0),
                end_time=time(10, 0),
                status='reserved',
                customer_name='Test',
            )


class BookingClosureModelTest(BaseBookingTestCase):
    """Tests para el modelo BookingClosure"""

    def test_create_closure(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test',
        )
        closure = BookingClosure.objects.create(
            booking=booking,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('12000'),
            transfer_amount=Decimal('12000'),
        )
        self.assertEqual(closure.total_amount, Decimal('24000'))

    def test_payment_summary_both(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test',
        )
        closure = BookingClosure.objects.create(
            booking=booking,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('12000'),
            transfer_amount=Decimal('12000'),
        )
        self.assertIn('Efectivo', closure.payment_summary)
        self.assertIn('Transferencia', closure.payment_summary)

    def test_payment_summary_cash_only(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(14, 0),
            end_time=time(15, 30),
            status='reserved',
            customer_name='Test',
        )
        closure = BookingClosure.objects.create(
            booking=booking,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('24000'),
            transfer_amount=Decimal('0'),
        )
        self.assertIn('Efectivo', closure.payment_summary)
        self.assertNotIn('Transferencia', closure.payment_summary)

    def test_total_includes_consumptions(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(16, 0),
            end_time=time(17, 30),
            status='reserved',
            customer_name='Test',
        )
        closure = BookingClosure.objects.create(
            booking=booking,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('24000'),
            consumptions_amount=Decimal('5000'),
        )
        self.assertEqual(closure.total_amount, Decimal('29000'))


class CancellationTokenModelTest(BaseBookingTestCase):
    """Tests para el modelo CancellationToken"""

    def test_auto_generate_token(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test',
        )
        token = CancellationToken.objects.create(booking=booking)
        self.assertIsNotNone(token.token)
        self.assertEqual(len(token.token), 8)

    def test_token_is_unique(self):
        booking1 = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test1',
        )
        booking2 = Booking.objects.create(
            court=self.court2,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test2',
        )
        t1 = CancellationToken.objects.create(booking=booking1)
        t2 = CancellationToken.objects.create(booking=booking2)
        self.assertNotEqual(t1.token, t2.token)


# =============================================================================
# Service Tests
# =============================================================================

class BookingServiceCreateTest(BaseBookingTestCase):
    """Tests para BookingService - creación"""

    def test_create_booking_admin(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Admin Booking',
            user=self.admin,
        )
        self.assertEqual(booking.status, 'reserved')
        self.assertEqual(booking.origin, 'admin')
        self.assertEqual(booking.created_by, self.admin)

    def test_create_booking_overlap_raises(self):
        BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='First',
            user=self.admin,
        )
        with self.assertRaises(ValueError) as ctx:
            BookingService.create_booking(
                court=self.court,
                date=future_date(),
                start_time=time(10, 30),
                end_time=time(12, 0),
                customer_name='Overlap',
                user=self.admin,
            )
        self.assertIn('Ya existe', str(ctx.exception))

    def test_create_booking_inactive_court_raises(self):
        inactive = Court.objects.create(
            name='Inactiva', court_type='outdoor', is_active=False
        )
        with self.assertRaises(ValueError):
            BookingService.create_booking(
                court=inactive,
                date=future_date(),
                start_time=time(10, 0),
                end_time=time(11, 30),
                customer_name='Test',
            )

    def test_create_booking_invalid_times_raises(self):
        with self.assertRaises(ValueError):
            BookingService.create_booking(
                court=self.court,
                date=future_date(),
                start_time=time(12, 0),
                end_time=time(10, 0),
                customer_name='Test',
            )


class BookingServicePublicTest(BaseBookingTestCase):
    """Tests para BookingService - reservas públicas"""

    def test_create_public_booking(self):
        booking, token = BookingService.create_public_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Cliente',
            customer_phone='1155667788',
        )
        self.assertEqual(booking.origin, 'public')
        self.assertIsNotNone(token)
        self.assertIsNotNone(token.token)

    def test_public_booking_creates_notification(self):
        from apps.notifications.models import Notification
        BookingService.create_public_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Cliente',
            customer_phone='1155667788',
        )
        notifications = Notification.objects.filter(
            notification_type='booking_created'
        )
        self.assertTrue(notifications.exists())


class BookingServiceCancelTest(BaseBookingTestCase):
    """Tests para BookingService - cancelación"""

    def test_cancel_booking_admin(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='To Cancel',
            user=self.admin,
        )
        cancelled = BookingService.cancel_booking(booking.id, user=self.admin)
        self.assertEqual(cancelled.status, 'cancelled')

    def test_cancel_nonexistent_raises(self):
        with self.assertRaises(ValueError):
            BookingService.cancel_booking(99999)

    def test_cancel_completed_raises(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Test',
            user=self.admin,
        )
        BookingService.close_booking(
            booking.id, booking_amount=Decimal('24000'),
            cash_amount=Decimal('24000'), user=self.admin,
        )
        with self.assertRaises(ValueError):
            BookingService.cancel_booking(booking.id)

    def test_cancel_with_token(self):
        booking, token = BookingService.create_public_booking(
            court=self.court,
            date=future_date(days=14),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Cliente Token',
            customer_phone='1155667788',
        )
        cancelled = BookingService.cancel_booking_with_token(token.token)
        self.assertEqual(cancelled.status, 'cancelled')

    def test_cancel_invalid_token_raises(self):
        with self.assertRaises(ValueError):
            BookingService.cancel_booking_with_token('INVALIDTOKEN')

    def test_cancel_public_by_id(self):
        booking, _ = BookingService.create_public_booking(
            court=self.court,
            date=future_date(days=14),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Cancel By ID',
            customer_phone='1155667788',
        )
        cancelled = BookingService.cancel_booking_public(booking.id)
        self.assertEqual(cancelled.status, 'cancelled')

    def test_cancel_creates_notification(self):
        from apps.notifications.models import Notification
        booking, _ = BookingService.create_public_booking(
            court=self.court,
            date=future_date(days=14),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Notify Cancel',
            customer_phone='1155667788',
        )
        initial_count = Notification.objects.filter(
            notification_type='booking_cancelled'
        ).count()
        BookingService.cancel_booking_public(booking.id)
        new_count = Notification.objects.filter(
            notification_type='booking_cancelled'
        ).count()
        self.assertGreater(new_count, initial_count)


class BookingServiceCloseTest(BaseBookingTestCase):
    """Tests para BookingService - cierre de turno"""

    def test_close_booking_all_cash(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Close Cash',
            user=self.admin,
        )
        closure = BookingService.close_booking(
            booking.id,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('24000'),
            transfer_amount=Decimal('0'),
            user=self.admin,
        )
        self.assertEqual(closure.booking_amount, Decimal('24000'))
        self.assertEqual(closure.cash_amount, Decimal('24000'))
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'completed')

    def test_close_booking_split_payment(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(14, 0),
            end_time=time(15, 30),
            customer_name='Close Split',
            user=self.admin,
        )
        closure = BookingService.close_booking(
            booking.id,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('12000'),
            transfer_amount=Decimal('12000'),
            user=self.admin,
        )
        self.assertEqual(closure.cash_amount, Decimal('12000'))
        self.assertEqual(closure.transfer_amount, Decimal('12000'))

    def test_close_already_closed_raises(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(16, 0),
            end_time=time(17, 30),
            customer_name='Double Close',
            user=self.admin,
        )
        BookingService.close_booking(
            booking.id,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('24000'),
            user=self.admin,
        )
        with self.assertRaises(ValueError):
            BookingService.close_booking(
                booking.id,
                booking_amount=Decimal('24000'),
                cash_amount=Decimal('24000'),
                user=self.admin,
            )

    def test_close_cancelled_raises(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(18, 0),
            end_time=time(19, 30),
            customer_name='Cancel then close',
            user=self.admin,
        )
        BookingService.cancel_booking(booking.id)
        with self.assertRaises(ValueError):
            BookingService.close_booking(
                booking.id,
                booking_amount=Decimal('24000'),
                cash_amount=Decimal('24000'),
                user=self.admin,
            )


class BookingServiceSearchTest(BaseBookingTestCase):
    """Tests para BookingService - búsqueda"""

    def test_search_by_name(self):
        BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Juan Perez',
            customer_phone='1111111111',
            user=self.admin,
        )
        results = BookingService.search_bookings_by_customer(name='Juan')
        self.assertEqual(results.count(), 1)

    def test_search_by_phone(self):
        BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Maria',
            customer_phone='2222222222',
            user=self.admin,
        )
        results = BookingService.search_bookings_by_customer(phone='2222222222')
        self.assertEqual(results.count(), 1)

    def test_search_no_results(self):
        results = BookingService.search_bookings_by_customer(name='NoExiste')
        self.assertEqual(results.count(), 0)

    def test_search_excludes_completed(self):
        booking = BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Completed User',
            user=self.admin,
        )
        BookingService.close_booking(
            booking.id,
            booking_amount=Decimal('24000'),
            cash_amount=Decimal('24000'),
            user=self.admin,
        )
        results = BookingService.search_bookings_by_customer(name='Completed')
        self.assertEqual(results.count(), 0)


class BookingServiceSlotsTest(BaseBookingTestCase):
    """Tests para generación de slots disponibles"""

    def test_generate_slots_returns_list(self):
        slots = BookingService.generate_available_slots(future_date())
        self.assertIsInstance(slots, list)
        self.assertTrue(len(slots) > 0)

    def test_slot_has_expected_fields(self):
        slots = BookingService.generate_available_slots(future_date())
        slot = slots[0]
        self.assertIn('court_id', slot)
        self.assertIn('court_name', slot)
        self.assertIn('start_time', slot)
        self.assertIn('end_time', slot)
        self.assertIn('available', slot)
        self.assertIn('court_price', slot)

    def test_booked_slot_not_available(self):
        BookingService.create_booking(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            customer_name='Blocked',
            user=self.admin,
        )
        slots = BookingService.generate_available_slots(
            future_date(), court_id=self.court.id
        )
        booked_slot = next(
            (s for s in slots if s['start_time'] == '10:00' and s['court_id'] == self.court.id),
            None,
        )
        if booked_slot:
            self.assertFalse(booked_slot['available'])


# =============================================================================
# API Tests - Admin Endpoints
# =============================================================================

class BookingAPITest(APITestCase):
    """Tests para API de bookings (admin)"""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin', password='admin123', role='admin'
        )
        self.court = Court.objects.create(
            name='Cancha 1', court_type='indoor', price=24000, is_active=True
        )
        TimeSlotConfiguration.get_active()
        self.client = APIClient()
        login = self.client.post('/api/auth/login/', {
            'username': 'admin', 'password': 'admin123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_list_bookings(self):
        response = self.client.get('/api/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_booking(self):
        response = self.client.post('/api/bookings/', {
            'court': self.court.id,
            'date': str(future_date()),
            'start_time': '10:00',
            'end_time': '11:30',
            'customer_name': 'API Test',
            'customer_phone': '1122334455',
            'status': 'reserved',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_name'], 'API Test')

    def test_calendar_excludes_cancelled(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='cancelled',
            customer_name='Cancelled',
        )
        dt = future_date()
        response = self.client.get(
            f'/api/bookings/calendar/?date_from={dt}&date_to={dt}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [b['id'] for b in response.data]
        self.assertNotIn(booking.id, ids)

    def test_cancel_booking_api(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='To Cancel',
        )
        response = self.client.patch(f'/api/bookings/{booking.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'cancelled')

    def test_close_booking_api_split_payment(self):
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Close Test',
        )
        response = self.client.post(f'/api/bookings/{booking.id}/close/', {
            'booking_amount': '24000.00',
            'cash_amount': '12000.00',
            'transfer_amount': '12000.00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['cash_amount']), Decimal('12000.00'))
        self.assertEqual(Decimal(response.data['transfer_amount']), Decimal('12000.00'))

    def test_close_booking_auto_amount(self):
        """Test que booking_amount se auto-rellena desde el precio de la cancha"""
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(14, 0),
            end_time=time(15, 30),
            status='reserved',
            customer_name='Auto Amount',
        )
        response = self.client.post(f'/api/bookings/{booking.id}/close/', {
            'cash_amount': '24000.00',
            'transfer_amount': '0.00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['booking_amount']), Decimal('24000.00'))

    def test_close_booking_invalid_split_returns_error(self):
        """Test que cash + transfer != booking_amount da error"""
        booking = Booking.objects.create(
            court=self.court,
            date=future_date(),
            start_time=time(16, 0),
            end_time=time(17, 30),
            status='reserved',
            customer_name='Bad Split',
        )
        response = self.client.post(f'/api/bookings/{booking.id}/close/', {
            'booking_amount': '24000.00',
            'cash_amount': '10000.00',
            'transfer_amount': '10000.00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# =============================================================================
# API Tests - Public Endpoints
# =============================================================================

class PublicBookingAPITest(APITestCase):
    """Tests para API pública de bookings"""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin', password='admin123', role='admin'
        )
        self.court = Court.objects.create(
            name='Cancha 1', court_type='indoor', price=24000, is_active=True
        )
        self.config = TimeSlotConfiguration.get_active()
        self.client = APIClient()

    def test_public_courts_list(self):
        response = self.client.get('/api/public/courts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_public_available_slots(self):
        dt = future_date()
        response = self.client.get(f'/api/public/available-slots/?date={dt}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('slots', response.data)
        self.assertIn('config', response.data)

    def test_public_available_slots_no_date(self):
        response = self.client.get('/api/public/available-slots/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_create_booking(self):
        response = self.client.post('/api/public/bookings/', {
            'court': self.court.id,
            'date': str(future_date()),
            'start_time': '10:00',
            'end_time': '11:30',
            'customer_name': 'Cliente Pub',
            'customer_phone': '1155667788',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['customer_name'], 'Cliente Pub')
        self.assertIn('court_price', response.data)

    def test_public_create_booking_no_email_required(self):
        """Test que email no es requerido en la reserva pública"""
        response = self.client.post('/api/public/bookings/', {
            'court': self.court.id,
            'date': str(future_date()),
            'start_time': '10:00',
            'end_time': '11:30',
            'customer_name': 'Sin Email',
            'customer_phone': '1155667788',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_public_create_booking_shows_price(self):
        response = self.client.post('/api/public/bookings/', {
            'court': self.court.id,
            'date': str(future_date()),
            'start_time': '14:00',
            'end_time': '15:30',
            'customer_name': 'Con Precio',
            'customer_phone': '1155667788',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['court_price']), Decimal('24000.00'))

    def test_public_search_by_name(self):
        self.client.post('/api/public/bookings/', {
            'court': self.court.id,
            'date': str(future_date()),
            'start_time': '10:00',
            'end_time': '11:30',
            'customer_name': 'Buscable',
            'customer_phone': '1155667788',
        })
        response = self.client.get('/api/public/bookings/search/?name=Buscable')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['bookings']), 1)

    def test_public_search_by_phone(self):
        self.client.post('/api/public/bookings/', {
            'court': self.court.id,
            'date': str(future_date()),
            'start_time': '10:00',
            'end_time': '11:30',
            'customer_name': 'Phone Search',
            'customer_phone': '9988776655',
        })
        response = self.client.get('/api/public/bookings/search/?phone=9988776655')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['bookings']), 1)

    def test_public_search_no_params_error(self):
        response = self.client.get('/api/public/bookings/search/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_cancel_by_id(self):
        create_resp = self.client.post('/api/public/bookings/', {
            'court': self.court.id,
            'date': str(future_date(days=14)),
            'start_time': '10:00',
            'end_time': '11:30',
            'customer_name': 'Cancel ID',
            'customer_phone': '1155667788',
        })
        booking_id = create_resp.data['id']
        response = self.client.post('/api/public/bookings/cancel-by-id/', {
            'booking_id': booking_id,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['booking']['status'], 'cancelled')

    def test_public_cancel_no_id_error(self):
        response = self.client.post('/api/public/bookings/cancel-by-id/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_configuration(self):
        response = self.client.get('/api/public/configuration/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('opening_time', response.data)
        self.assertIn('closing_time', response.data)
        self.assertIn('slot_duration_minutes', response.data)
