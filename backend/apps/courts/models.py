from django.db import models


class Court(models.Model):
    """
    Cancha de pádel
    """
    COURT_TYPES = [
        ('indoor', 'Interior'),
        ('outdoor', 'Exterior'),
        ('glass', 'Cristal'),
    ]
    
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nombre'
    )
    court_type = models.CharField(
        max_length=20,
        choices=COURT_TYPES,
        verbose_name='Tipo'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Precio por turno'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activa'
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
        verbose_name = 'Cancha'
        verbose_name_plural = 'Canchas'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_court_type_display()})"


class TimeSlotConfiguration(models.Model):
    """
    Configuración global de horarios para generación de slots
    Solo debe existir un registro activo (singleton)
    """
    opening_time = models.TimeField(
        default='08:00',
        verbose_name='Hora de apertura'
    )
    closing_time = models.TimeField(
        default='23:00',
        verbose_name='Hora de cierre'
    )
    slot_duration_minutes = models.IntegerField(
        default=90,
        verbose_name='Duración del turno (minutos)'
    )
    min_cancellation_hours = models.IntegerField(
        default=2,
        verbose_name='Horas mínimas para cancelar'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Configuración activa'
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
        verbose_name = 'Configuración de Horarios'
        verbose_name_plural = 'Configuraciones de Horarios'
    
    def __str__(self):
        return f"Horario: {self.opening_time}-{self.closing_time} ({self.slot_duration_minutes}min)"
    
    def save(self, *args, **kwargs):
        # Si se activa esta configuración, desactivar las demás
        if self.is_active:
            TimeSlotConfiguration.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)
    
    @classmethod
    def get_active(cls):
        """Obtener la configuración activa o crear una por defecto"""
        config = cls.objects.filter(is_active=True).first()
        if not config:
            config = cls.objects.create(is_active=True)
        return config
