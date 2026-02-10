from django.db import models


class Product(models.Model):
    """
    Producto disponible para consumo
    """
    CATEGORY_CHOICES = [
        ('beverage', 'Bebida'),
        ('snack', 'Snack'),
        ('equipment', 'Equipamiento'),
        ('other', 'Otro'),
    ]
    
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre'
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        verbose_name='Categoría'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    stock = models.IntegerField(
        default=0,
        null=True,
        blank=True,
        verbose_name='Stock',
        help_text='Dejar en blanco para no controlar stock'
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
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} - ${self.price}"


class Consumption(models.Model):
    """
    Consumo de producto asociado a un turno
    """
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='consumptions',
        verbose_name='Turno'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name='Producto'
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Cantidad'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio unitario',
        help_text='Precio al momento de la venta'
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio total'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    
    class Meta:
        verbose_name = 'Consumo'
        verbose_name_plural = 'Consumos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity} - {self.booking}"
    
    def save(self, *args, **kwargs):
        # Calcular total automáticamente
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
