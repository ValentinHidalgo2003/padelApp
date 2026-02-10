from rest_framework import serializers
from .models import TimeSlotConfiguration, Court


class TimeSlotConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializer para configuración de horarios
    """
    class Meta:
        model = TimeSlotConfiguration
        fields = [
            'id', 'opening_time', 'closing_time',
            'slot_duration_minutes', 'min_cancellation_hours',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_slot_duration_minutes(self, value):
        if value < 30 or value > 180:
            raise serializers.ValidationError('La duración debe estar entre 30 y 180 minutos')
        return value
    
    def validate_min_cancellation_hours(self, value):
        if value < 0 or value > 48:
            raise serializers.ValidationError('Las horas de anticipación deben estar entre 0 y 48')
        return value
    
    def validate(self, attrs):
        opening = attrs.get('opening_time')
        closing = attrs.get('closing_time')
        if opening and closing and opening >= closing:
            raise serializers.ValidationError({
                'closing_time': 'La hora de cierre debe ser posterior a la hora de apertura'
            })
        return attrs


class CourtPriceSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar precio de cancha
    """
    court_type_display = serializers.CharField(source='get_court_type_display', read_only=True)
    
    class Meta:
        model = Court
        fields = ['id', 'name', 'court_type', 'court_type_display', 'price', 'is_active']
        read_only_fields = ['id', 'name', 'court_type', 'court_type_display', 'is_active']
