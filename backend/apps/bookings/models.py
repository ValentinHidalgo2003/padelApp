import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Booking(models.Model):
    """
    Turno de cancha
    """
    STATUS_CHOICES = [
        ('available', 'Libre'),
        ('reserved', 'Reservado'),
        ('cancelled', 'Cancelado'),
        ('completed', 'Jugado'),
    ]
    
    ORIGIN_CHOICES = [
        ('admin', 'Panel Admin'),
        ('public', 'Reserva Online'),
    ]
    
    court = models.ForeignKey(
        'courts.Court',
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name='Cancha'
    )
    date = models.DateField(
        verbose_name='Fecha'
    )
    start_time = models.TimeField(
        verbose_name='Hora inicio'
    )
    end_time = models.TimeField(
        verbose_name='Hora fin'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
        verbose_name='Estado'
    )
    customer_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Nombre del cliente'
    )
    customer_phone = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Teléfono del cliente'
    )
    customer_email = models.EmailField(
        blank=True,
        verbose_name='Email del cliente'
    )
    origin = models.CharField(
        max_length=20,
        choices=ORIGIN_CHOICES,
        default='admin',
        verbose_name='Origen de reserva'
    )
    notes = models.TextField(
        blank=True,
        verbose_name='Notas'
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings_created',
        verbose_name='Creado por'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    
    class Meta:
        verbose_name = 'Turno'
        verbose_name_plural = 'Turnos'
        ordering = ['date', 'start_time']
        unique_together = ['court', 'date', 'start_time']
        indexes = [
            models.Index(fields=['court', 'date', 'start_time']),
            models.Index(fields=['date', 'status']),
        ]
    
    def __str__(self):
        return f"{self.court.name} - {self.date} {self.start_time}-{self.end_time}"
    
    def clean(self):
        """
        Validación de modelo
        """
        super().clean()
        
        # Validar que hora fin sea mayor a hora inicio
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError({
                    'end_time': 'La hora de fin debe ser posterior a la hora de inicio'
                })
        
        # Validar que la cancha esté activa solo en nuevos turnos
        # No validar en actualizaciones de estado
        if not self.pk and self.court and not self.court.is_active:
            raise ValidationError({
                'court': 'No se pueden crear turnos en una cancha inactiva'
            })
    
    def save(self, *args, **kwargs):
        # Solo validar en creación o cuando skip_validation no está presente
        skip_validation = kwargs.pop('skip_validation', False)
        if not skip_validation:
            self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def duration_minutes(self):
        """Duración del turno en minutos"""
        if self.start_time and self.end_time:
            start = timezone.datetime.combine(timezone.datetime.today(), self.start_time)
            end = timezone.datetime.combine(timezone.datetime.today(), self.end_time)
            return int((end - start).total_seconds() / 60)
        return 0
    
    @property
    def can_be_cancelled(self):
        """Determina si el turno puede ser cancelado"""
        return self.status in ['available', 'reserved']
    
    @property
    def can_be_closed(self):
        """Determina si el turno puede ser cerrado"""
        return self.status == 'reserved'


class BookingClosure(models.Model):
    """
    Cierre de turno con información de pago
    """
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='closure',
        verbose_name='Turno'
    )
    booking_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Monto del turno'
    )
    cash_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Monto en efectivo'
    )
    transfer_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Monto en transferencia'
    )
    consumptions_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Monto de consumos'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Monto total'
    )
    notes = models.TextField(
        blank=True,
        verbose_name='Notas'
    )
    closed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='closures_made',
        verbose_name='Cerrado por'
    )
    closed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de cierre'
    )
    
    class Meta:
        verbose_name = 'Cierre de Turno'
        verbose_name_plural = 'Cierres de Turnos'
        ordering = ['-closed_at']
    
    def __str__(self):
        return f"Cierre: {self.booking} - ${self.total_amount}"
    
    @property
    def payment_summary(self):
        """Resumen de métodos de pago usados"""
        parts = []
        if self.cash_amount > 0:
            parts.append(f"Efectivo: ${self.cash_amount}")
        if self.transfer_amount > 0:
            parts.append(f"Transferencia: ${self.transfer_amount}")
        return ' / '.join(parts) if parts else 'Sin pago'
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total_amount = self.booking_amount + self.consumptions_amount
        super().save(*args, **kwargs)


class CancellationToken(models.Model):
    """
    Token único para que los clientes puedan cancelar sus reservas
    """
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='cancellation_token',
        verbose_name='Turno'
    )
    token = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        verbose_name='Token de cancelación'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    
    class Meta:
        verbose_name = 'Token de Cancelación'
        verbose_name_plural = 'Tokens de Cancelación'
    
    def __str__(self):
        return f"Token: {self.token} - {self.booking}"
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)
