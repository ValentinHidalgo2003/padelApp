from django.db import models


class Notification(models.Model):
    """
    Notificación para administradores
    """
    NOTIFICATION_TYPES = [
        ('booking_created', 'Reserva Creada'),
        ('booking_cancelled', 'Reserva Cancelada'),
    ]

    recipient = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinatario'
    )
    title = models.CharField(
        max_length=200,
        verbose_name='Título'
    )
    message = models.TextField(
        verbose_name='Mensaje'
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES,
        verbose_name='Tipo de notificación'
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Turno'
    )
    is_read = models.BooleanField(
        default=False,
        verbose_name='Leída'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )

    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.recipient.username}"

    @classmethod
    def notify_admins(cls, title, message, notification_type, booking=None):
        """
        Crear notificaciones para todos los usuarios admin
        """
        from apps.users.models import User
        admins = User.objects.filter(role='admin')
        notifications = []
        for admin in admins:
            notifications.append(cls(
                recipient=admin,
                title=title,
                message=message,
                notification_type=notification_type,
                booking=booking,
            ))
        cls.objects.bulk_create(notifications)
