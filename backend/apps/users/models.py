from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Usuario del sistema con roles diferenciados
    """
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('reception', 'Recepción'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='reception',
        verbose_name='Rol'
    )
    phone = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Teléfono'
    )
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_reception(self):
        return self.role == 'reception'
