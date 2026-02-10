from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Notification
from apps.bookings.models import Booking
from apps.courts.models import Court

User = get_user_model()


class NotificationModelTest(TestCase):
    """Tests para el modelo Notification"""

    def setUp(self):
        self.admin1 = User.objects.create_user(
            username='admin1', password='pass123', role='admin'
        )
        self.admin2 = User.objects.create_user(
            username='admin2', password='pass123', role='admin'
        )
        self.reception = User.objects.create_user(
            username='recep', password='pass123', role='reception'
        )

    def test_notify_admins_creates_for_all_admins(self):
        Notification.notify_admins(
            title='Test',
            message='Test message',
            notification_type='booking_created',
        )
        self.assertEqual(Notification.objects.count(), 2)
        self.assertTrue(
            Notification.objects.filter(recipient=self.admin1).exists()
        )
        self.assertTrue(
            Notification.objects.filter(recipient=self.admin2).exists()
        )

    def test_notify_admins_does_not_notify_reception(self):
        Notification.notify_admins(
            title='Test',
            message='Test',
            notification_type='booking_created',
        )
        self.assertFalse(
            Notification.objects.filter(recipient=self.reception).exists()
        )

    def test_notification_default_unread(self):
        Notification.notify_admins(
            title='Unread Test',
            message='Test',
            notification_type='booking_created',
        )
        for notif in Notification.objects.all():
            self.assertFalse(notif.is_read)

    def test_notification_str(self):
        notif = Notification.objects.create(
            recipient=self.admin1,
            title='My Title',
            message='Body',
            notification_type='booking_created',
        )
        self.assertIn('My Title', str(notif))
        self.assertIn('admin1', str(notif))

    def test_notification_with_booking(self):
        court = Court.objects.create(
            name='C1', court_type='indoor', price=24000
        )
        from datetime import date, time
        booking = Booking.objects.create(
            court=court,
            date=date(2026, 12, 1),
            start_time=time(10, 0),
            end_time=time(11, 30),
            status='reserved',
            customer_name='Test',
        )
        Notification.notify_admins(
            title='Booking Notif',
            message='Msg',
            notification_type='booking_created',
            booking=booking,
        )
        notif = Notification.objects.first()
        self.assertEqual(notif.booking, booking)


class NotificationAPITest(APITestCase):
    """Tests para API de notificaciones"""

    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin', password='admin123', role='admin'
        )
        self.client = APIClient()
        login = self.client.post('/api/auth/login/', {
            'username': 'admin', 'password': 'admin123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

        # Create some notifications
        for i in range(5):
            Notification.objects.create(
                recipient=self.admin,
                title=f'Notif {i}',
                message=f'Message {i}',
                notification_type='booking_created',
            )

    def test_list_notifications(self):
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)

    def test_unread_count(self):
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 5)

    def test_mark_as_read(self):
        notif = Notification.objects.filter(recipient=self.admin).first()
        response = self.client.patch(f'/api/notifications/{notif.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_all_read(self):
        response = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unread = Notification.objects.filter(
            recipient=self.admin, is_read=False
        ).count()
        self.assertEqual(unread, 0)

    def test_unread_count_after_mark_all(self):
        self.client.post('/api/notifications/mark-all-read/')
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.data['unread_count'], 0)

    def test_notifications_require_auth(self):
        anon = APIClient()
        response = anon.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_only_sees_own_notifications(self):
        other_admin = User.objects.create_user(
            username='other', password='other123', role='admin'
        )
        Notification.objects.create(
            recipient=other_admin,
            title='Other Notif',
            message='Not mine',
            notification_type='booking_cancelled',
        )
        response = self.client.get('/api/notifications/')
        # Should only see the 5 original notifications, not the other admin's
        self.assertEqual(len(response.data), 5)
