from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Booking, BookingClosure
from .serializers import (
    BookingSerializer, BookingListSerializer, BookingCalendarSerializer,
    BookingCreateUpdateSerializer, BookingClosureSerializer, CloseBookingSerializer
)
from .services import BookingService
from apps.users.permissions import IsAdminOrReception


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de turnos
    """
    queryset = Booking.objects.select_related('court', 'created_by', 'closure').prefetch_related('consumptions')
    permission_classes = [IsAdminOrReception]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['court', 'date', 'status']
    search_fields = ['customer_name', 'customer_phone']
    ordering_fields = ['date', 'start_time', 'created_at']
    ordering = ['date', 'start_time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        elif self.action == 'calendar':
            return BookingCalendarSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return BookingCreateUpdateSerializer
        return BookingSerializer
    
    def perform_create(self, serializer):
        """
        Asignar usuario actual al crear
        """
        serializer.save(created_by=self.request.user, status='reserved')
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """
        Vista optimizada para calendario
        Filtros: date_from, date_to, court
        """
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        court_id = request.query_params.get('court')
        
        queryset = self.get_queryset().exclude(status='cancelled')
        
        # Aplicar filtros
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=date_to)
            except ValueError:
                pass
        
        if court_id:
            queryset = queryset.filter(court_id=court_id)
        
        # Si no se especifican fechas, traer semana actual
        if not date_from and not date_to:
            today = datetime.now().date()
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            queryset = queryset.filter(date__gte=week_start, date__lte=week_end)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        """
        Cancelar un turno
        """
        booking = self.get_object()
        
        try:
            cancelled_booking = BookingService.cancel_booking(
                booking_id=booking.id,
                user=request.user
            )
            serializer = BookingSerializer(cancelled_booking)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Cerrar un turno
        """
        booking = self.get_object()
        
        serializer = CloseBookingSerializer(
            data=request.data,
            context={'booking': booking}
        )
        serializer.is_valid(raise_exception=True)
        
        try:
            closure = BookingService.close_booking(
                booking_id=booking.id,
                booking_amount=serializer.validated_data['booking_amount'],
                cash_amount=serializer.validated_data.get('cash_amount', 0),
                transfer_amount=serializer.validated_data.get('transfer_amount', 0),
                notes=serializer.validated_data.get('notes', ''),
                user=request.user
            )
            
            closure_serializer = BookingClosureSerializer(closure)
            return Response(closure_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def closure(self, request, pk=None):
        """
        Obtener detalle del cierre de un turno
        """
        booking = self.get_object()
        
        if not hasattr(booking, 'closure'):
            return Response(
                {'error': 'Este turno no ha sido cerrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = BookingClosureSerializer(booking.closure)
        return Response(serializer.data)
