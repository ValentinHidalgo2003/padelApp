from rest_framework import serializers
from .models import Booking


class PublicBookingCreateSerializer(serializers.Serializer):
    """
    Serializer para crear reserva pública (sin autenticación)
    """
    court = serializers.IntegerField()
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    customer_name = serializers.CharField(max_length=200)
    customer_phone = serializers.CharField(max_length=50)
    
    def validate_customer_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres')
        return value.strip()
    
    def validate_customer_phone(self, value):
        cleaned = ''.join(c for c in value if c.isdigit() or c == '+')
        if len(cleaned) < 8:
            raise serializers.ValidationError('Ingresá un número de teléfono válido')
        return value.strip()


class PublicBookingResponseSerializer(serializers.ModelSerializer):
    """
    Serializer para respuesta de reserva pública
    """
    court_name = serializers.CharField(source='court.name', read_only=True)
    court_price = serializers.DecimalField(source='court.price', max_digits=10, decimal_places=2, read_only=True)
    cancellation_code = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'court', 'court_name', 'court_price',
            'date', 'start_time', 'end_time',
            'status', 'customer_name', 'customer_phone',
            'cancellation_code'
        ]
    
    def get_cancellation_code(self, obj):
        if hasattr(obj, 'cancellation_token'):
            return obj.cancellation_token.token
        return None


class PublicCancelSerializer(serializers.Serializer):
    """
    Serializer para cancelar reserva con token
    """
    token = serializers.CharField(max_length=32)


class PublicVerifySerializer(serializers.Serializer):
    """
    Serializer para verificar reserva con token
    """
    token = serializers.CharField(max_length=32)
