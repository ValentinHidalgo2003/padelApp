from rest_framework import serializers
from .models import Product, Consumption
from apps.bookings.models import Booking


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer para productos
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_display',
            'price', 'is_active', 'stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio debe ser mayor a 0')
        return value
    
    def validate_stock(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('El stock no puede ser negativo')
        return value


class ProductListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'category_display', 'price', 'stock', 'is_active']


class ConsumptionSerializer(serializers.ModelSerializer):
    """
    Serializer para consumos
    """
    product_info = ProductListSerializer(source='product', read_only=True)
    
    class Meta:
        model = Consumption
        fields = [
            'id', 'booking', 'product', 'product_info',
            'quantity', 'unit_price', 'total_price', 'created_at'
        ]
        read_only_fields = ['id', 'total_price', 'created_at']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a 0')
        return value
    
    def validate_unit_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('El precio unitario debe ser mayor a 0')
        return value
    
    def validate(self, attrs):
        """
        Validaciones del consumo
        """
        booking = attrs.get('booking')
        product = attrs.get('product')
        quantity = attrs.get('quantity', 1)
        
        # Validar que el turno exista y esté reservado o completado
        if booking and booking.status not in ['reserved', 'completed']:
            raise serializers.ValidationError({
                'booking': 'Solo se pueden agregar consumos a turnos reservados o completados'
            })
        
        # Validar stock si el producto lo controla
        if product and product.stock is not None:
            if product.stock < quantity:
                raise serializers.ValidationError({
                    'quantity': f'Stock insuficiente. Disponible: {product.stock}'
                })
        
        # Si no se provee unit_price, usar el precio actual del producto
        if 'unit_price' not in attrs and product:
            attrs['unit_price'] = product.price
        
        return attrs


class ConsumptionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear consumos
    """
    class Meta:
        model = Consumption
        fields = ['booking', 'product', 'quantity', 'unit_price']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a 0')
        return value
    
    def validate(self, attrs):
        booking = attrs.get('booking')
        product = attrs.get('product')
        quantity = attrs.get('quantity', 1)
        
        if booking and booking.status not in ['reserved', 'completed']:
            raise serializers.ValidationError(
                'Solo se pueden agregar consumos a turnos reservados o completados'
            )
        
        if product and product.stock is not None:
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f'Stock insuficiente. Disponible: {product.stock}'
                )
        
        # Si no se provee unit_price, usar el precio actual del producto
        if 'unit_price' not in attrs and product:
            attrs['unit_price'] = product.price
        
        return attrs
