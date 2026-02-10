from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from datetime import datetime

from apps.courts.models import Court, TimeSlotConfiguration
from apps.courts.serializers import CourtListSerializer
from .services import BookingService
from .public_serializers import (
    PublicBookingCreateSerializer,
    PublicBookingResponseSerializer,
    PublicCancelSerializer,
)


class PublicBookingThrottle(AnonRateThrottle):
    rate = '30/hour'


@api_view(['GET'])
@permission_classes([AllowAny])
def public_courts_list(request):
    """
    Listar canchas activas con precios (público)
    """
    courts = Court.objects.filter(is_active=True).order_by('name')
    serializer = CourtListSerializer(courts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_available_slots(request):
    """
    Ver slots disponibles para una fecha (y opcionalmente una cancha)
    Query params: date (YYYY-MM-DD), court_id (optional)
    """
    date_str = request.query_params.get('date')
    court_id = request.query_params.get('court_id')
    
    if not date_str:
        return Response(
            {'error': 'El parámetro date es obligatorio (formato: YYYY-MM-DD)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Formato de fecha inválido. Usá YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # No permitir fechas pasadas
    if date < datetime.now().date():
        return Response(
            {'error': 'No se pueden ver horarios de fechas pasadas'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    slots = BookingService.generate_available_slots(date, court_id)
    
    # También retornar la configuración de horarios
    config = TimeSlotConfiguration.get_active()
    
    return Response({
        'date': date_str,
        'config': {
            'opening_time': config.opening_time.strftime('%H:%M'),
            'closing_time': config.closing_time.strftime('%H:%M'),
            'slot_duration_minutes': config.slot_duration_minutes,
        },
        'slots': slots,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PublicBookingThrottle])
def public_create_booking(request):
    """
    Crear reserva pública (sin autenticación)
    """
    serializer = PublicBookingCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    data = serializer.validated_data
    
    try:
        court = Court.objects.get(pk=data['court'], is_active=True)
    except Court.DoesNotExist:
        return Response(
            {'error': 'Cancha no encontrada o inactiva'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        booking, token = BookingService.create_public_booking(
            court=court,
            date=data['date'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            customer_name=data['customer_name'],
            customer_phone=data['customer_phone'],
        )
        
        response_serializer = PublicBookingResponseSerializer(booking)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def public_cancel_booking(request):
    """
    Cancelar reserva con token de cancelación
    """
    serializer = PublicCancelSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    try:
        booking = BookingService.cancel_booking_with_token(
            token_str=serializer.validated_data['token']
        )
        return Response({
            'message': 'Reserva cancelada correctamente',
            'booking': {
                'id': booking.id,
                'court_name': booking.court.name,
                'date': booking.date.isoformat(),
                'start_time': booking.start_time.strftime('%H:%M'),
                'end_time': booking.end_time.strftime('%H:%M'),
                'status': booking.status,
            }
        })
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_verify_booking(request):
    """
    Verificar reserva por token de cancelación
    Query params: token
    """
    token_str = request.query_params.get('token')
    
    if not token_str:
        return Response(
            {'error': 'El parámetro token es obligatorio'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        result = BookingService.verify_booking_by_token(token_str)
        booking = result['booking']
        
        return Response({
            'booking': {
                'id': booking.id,
                'court_name': booking.court.name,
                'court_price': str(booking.court.price),
                'date': booking.date.isoformat(),
                'start_time': booking.start_time.strftime('%H:%M'),
                'end_time': booking.end_time.strftime('%H:%M'),
                'status': booking.status,
                'customer_name': booking.customer_name,
                'customer_phone': booking.customer_phone,
            },
            'can_cancel': result['can_cancel'],
            'min_cancellation_hours': result['min_cancellation_hours'],
            'hours_until_booking': result['hours_until_booking'],
        })
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_search_bookings(request):
    """
    Buscar reservas por nombre o teléfono (para cancelación)
    Se requiere al menos uno de los dos parámetros: name o phone
    """
    name = request.query_params.get('name', '').strip()
    phone = request.query_params.get('phone', '').strip()
    
    if not name and not phone:
        return Response(
            {'error': 'Se requiere nombre o teléfono para buscar'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    bookings = BookingService.search_bookings_by_customer(name=name or None, phone=phone or None)
    
    config = TimeSlotConfiguration.get_active()
    
    results = []
    for booking in bookings:
        # Calcular si se puede cancelar
        from django.utils import timezone
        booking_datetime = timezone.make_aware(
            datetime.combine(booking.date, booking.start_time)
        )
        now = timezone.now()
        hours_until = (booking_datetime - now).total_seconds() / 3600
        can_cancel = booking.can_be_cancelled and hours_until >= config.min_cancellation_hours
        
        results.append({
            'id': booking.id,
            'court_name': booking.court.name,
            'date': booking.date.isoformat(),
            'start_time': booking.start_time.strftime('%H:%M'),
            'end_time': booking.end_time.strftime('%H:%M'),
            'status': booking.status,
            'customer_name': booking.customer_name,
            'can_cancel': can_cancel,
            'min_cancellation_hours': config.min_cancellation_hours,
        })
    
    return Response({'bookings': results})


@api_view(['POST'])
@permission_classes([AllowAny])
def public_cancel_booking_by_id(request):
    """
    Cancelar reserva por ID
    """
    booking_id = request.data.get('booking_id')
    
    if not booking_id:
        return Response(
            {'error': 'Se requiere booking_id'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        booking = BookingService.cancel_booking_public(booking_id)
        return Response({
            'message': 'Reserva cancelada correctamente',
            'booking': {
                'id': booking.id,
                'court_name': booking.court.name,
                'date': booking.date.isoformat(),
                'start_time': booking.start_time.strftime('%H:%M'),
                'end_time': booking.end_time.strftime('%H:%M'),
                'status': booking.status,
            }
        })
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_configuration(request):
    """
    Obtener configuración pública (horarios y duración de slots)
    """
    config = TimeSlotConfiguration.get_active()
    return Response({
        'opening_time': config.opening_time.strftime('%H:%M'),
        'closing_time': config.closing_time.strftime('%H:%M'),
        'slot_duration_minutes': config.slot_duration_minutes,
    })
