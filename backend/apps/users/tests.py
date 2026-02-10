from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

User = get_user_model()


class UserModelTest(TestCase):
    """Tests para el modelo User"""

    def test_create_admin_user(self):
        user = User.objects.create_user(
            username='admin1', password='testpass123', role='admin'
        )
        self.assertEqual(user.role, 'admin')
        self.assertTrue(user.is_admin)
        self.assertFalse(user.is_reception)

    def test_create_reception_user(self):
        user = User.objects.create_user(
            username='recep1', password='testpass123', role='reception'
        )
        self.assertEqual(user.role, 'reception')
        self.assertFalse(user.is_admin)
        self.assertTrue(user.is_reception)

    def test_default_role_is_reception(self):
        user = User.objects.create_user(username='default1', password='testpass123')
        self.assertEqual(user.role, 'reception')

    def test_str_representation(self):
        user = User.objects.create_user(
            username='testuser', password='testpass123', role='admin'
        )
        self.assertEqual(str(user), 'testuser (Administrador)')


class AuthAPITest(APITestCase):
    """Tests para autenticación JWT"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testadmin', password='testpass123', role='admin'
        )
        self.client = APIClient()

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'testpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'wrongpassword',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        login = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'testpass123',
        })
        refresh = login.data['refresh']
        response = self.client.post('/api/auth/refresh/', {
            'refresh': refresh,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_protected_endpoint_without_token(self):
        response = self.client.get('/api/bookings/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_with_token(self):
        login = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'testpass123',
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        response = self.client.get('/api/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
