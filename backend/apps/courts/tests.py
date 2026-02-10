from django.test import TestCase
from .models import Court, TimeSlotConfiguration


class CourtModelTest(TestCase):
    """Tests para el modelo Court"""

    def test_create_court(self):
        court = Court.objects.create(
            name='Cancha 1', court_type='indoor', price=24000
        )
        self.assertEqual(court.name, 'Cancha 1')
        self.assertEqual(court.court_type, 'indoor')
        self.assertEqual(court.price, 24000)
        self.assertTrue(court.is_active)

    def test_court_str(self):
        court = Court.objects.create(
            name='Cancha Test', court_type='glass', price=24000
        )
        self.assertEqual(str(court), 'Cancha Test (Cristal)')

    def test_court_default_price(self):
        court = Court.objects.create(name='Cancha Sin Precio', court_type='outdoor')
        self.assertEqual(court.price, 0)


class TimeSlotConfigurationTest(TestCase):
    """Tests para configuración de horarios"""

    def test_get_active_creates_default(self):
        config = TimeSlotConfiguration.get_active()
        self.assertIsNotNone(config)
        self.assertTrue(config.is_active)
        self.assertEqual(config.slot_duration_minutes, 90)

    def test_only_one_active_at_a_time(self):
        config1 = TimeSlotConfiguration.objects.create(is_active=True)
        config2 = TimeSlotConfiguration.objects.create(is_active=True)
        config1.refresh_from_db()
        self.assertFalse(config1.is_active)
        self.assertTrue(config2.is_active)

    def test_cancellation_hours_default(self):
        config = TimeSlotConfiguration.get_active()
        self.assertEqual(config.min_cancellation_hours, 2)
