from rest_framework import serializers
from django.db.models import Q
from .models import Booking, BookingClosure
from apps.courts.serializers import CourtListSerializer
from apps.users.serializers import UserSerializer


class BookingClosureSerializer(serializers.ModelSerializer):
    """
    Serializer para cierre de turno
    """
    payment_summary = serializers.CharField(read_only=True)
    closed_by_info = UserSerializer(source='closed_by', read_only=True)
    
    class Meta:
        model = BookingClosure
        fields = [
            'id', 'booking', 'cash_amount', 'transfer_amount',
            'payment_summary',
            'booking_amount', 'consumptions_amount', 'total_amount',
            'notes', 'closed_by', 'closed_by_info', 'closed_at'
        ]
        read_only_fields = ['id', 'consumptions_amount', 'total_amount', 'closed_by', 'closed_at']


class BookingSerializer(serializers.ModelSerializer):
    """
    Serializer completo para turnos
    """
    court_info = CourtListSerializer(source='court', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_info = UserSerializer(source='created_by', read_only=True)
    closure = BookingClosureSerializer(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    can_be_closed = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'court', 'court_info', 'date', 'start_time', 'end_time',
            'status', 'status_display', 'customer_name', 'customer_phone',
            'notes', 'created_by', 'created_by_info', 'created_at', 'updated_at',
            'duration_minutes', 'can_be_cancelled', 'can_be_closed', 'closure'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """
        Validaciones del turno
        """
        court = attrs.get('court')
        date = attrs.get('date')
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        # Validar que la hora de fin sea mayor a la de inicio
        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError({
                    'end_time': 'La hora de fin debe ser posterior a la hora de inicio'
                })
        
        # Validar que la cancha esté activa
        if court and not court.is_active:
            raise serializers.ValidationError({
                'court': 'No se pueden crear turnos en una cancha inactiva'
            })
        
        # Validar overlap solo si es creación o si se cambia algún campo de tiempo
        if not self.instance or any(k in attrs for k in ['court', 'date', 'start_time', 'end_time']):
            # Usar valores actuales si no se proveen nuevos
            if self.instance:
                court = court or self.instance.court
                date = date or self.instance.date
                start_time = start_time or self.instance.start_time
                end_time = end_time or self.instance.end_time
            
            # Buscar overlaps
            overlapping = Booking.objects.filter(
                court=court,
                date=date,
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exclude(status='cancelled')
            
            # Excluir la instancia actual en updates
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)
            
            if overlapping.exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Ya existe un turno en este horario para esta cancha'
                })
        
        return attrs


class BookingListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados
    """
    court_name = serializers.CharField(source='court.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'court', 'court_name', 'date', 'start_time', 'end_time',
            'status', 'status_display', 'customer_name', 'customer_phone'
        ]


class BookingCalendarSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para vista de calendario
    """
    court_id = serializers.IntegerField(source='court.id', read_only=True)
    court_name = serializers.CharField(source='court.name', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'court_id', 'court_name', 'date', 'start_time',
            'end_time', 'status', 'customer_name'
        ]


class BookingCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear y actualizar turnos
    """
    class Meta:
        model = Booking
        fields = [
            'court', 'date', 'start_time', 'end_time',
            'customer_name', 'customer_phone', 'notes', 'status'
        ]
    
    def validate(self, attrs):
        """
        Reutilizar validaciones del BookingSerializer
        """
        # Aplicar las mismas validaciones
        court = attrs.get('court')
        date = attrs.get('date')
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError({
                    'end_time': 'La hora de fin debe ser posterior a la hora de inicio'
                })
        
        if court and not court.is_active:
            raise serializers.ValidationError({
                'court': 'No se pueden crear turnos en una cancha inactiva'
            })
        
        # Validar overlap
        if not self.instance or any(k in attrs for k in ['court', 'date', 'start_time', 'end_time']):
            if self.instance:
                court = court or self.instance.court
                date = date or self.instance.date
                start_time = start_time or self.instance.start_time
                end_time = end_time or self.instance.end_time
            
            overlapping = Booking.objects.filter(
                court=court,
                date=date,
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exclude(status='cancelled')
            
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)
            
            if overlapping.exists():
                raise serializers.ValidationError(
                    'Ya existe un turno en este horario para esta cancha'
                )
        
        return attrs


class CloseBookingSerializer(serializers.Serializer):
    """
    Serializer para cerrar un turno
    """
    booking_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, required=False)
    cash_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)
    transfer_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        booking = self.context.get('booking')
        
        if not booking:
            raise serializers.ValidationError('Turno no encontrado')
        
        if booking.status != 'reserved':
            raise serializers.ValidationError('Solo se pueden cerrar turnos reservados')
        
        if hasattr(booking, 'closure'):
            raise serializers.ValidationError('Este turno ya fue cerrado')
        
        # Si no se envía booking_amount, usar precio de la cancha
        if 'booking_amount' not in attrs or attrs['booking_amount'] is None:
            attrs['booking_amount'] = booking.court.price
        
        # Validar que efectivo + transferencia == booking_amount
        cash = attrs.get('cash_amount', 0) or 0
        transfer = attrs.get('transfer_amount', 0) or 0
        booking_amount = attrs['booking_amount']
        
        if cash + transfer != booking_amount:
            raise serializers.ValidationError(
                f'La suma de efectivo (${cash}) + transferencia (${transfer}) debe ser igual al monto del turno (${booking_amount})'
            )
        
        return attrs
