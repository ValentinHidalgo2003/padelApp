from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from datetime import time, datetime, timedelta
from .models import Booking, BookingClosure, CancellationToken
from apps.products.models import Consumption
from apps.courts.models import TimeSlotConfiguration
from apps.notifications.models import Notification


class BookingService:
    """
    Lógica de negocio para gestión de turnos
    """
    
    @staticmethod
    def create_booking(court, date, start_time, end_time, customer_name, customer_phone='', notes='', user=None):
        """
        Crear un nuevo turno con validaciones (desde panel admin)
        """
        # Validar que la cancha esté activa
        if not court.is_active:
            raise ValueError('No se pueden crear turnos en una cancha inactiva')
        
        # Validar horarios
        if end_time <= start_time:
            raise ValueError('La hora de fin debe ser posterior a la hora de inicio')
        
        # Validar overlap
        overlapping = Booking.objects.filter(
            court=court,
            date=date,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exclude(status='cancelled')
        
        if overlapping.exists():
            raise ValueError('Ya existe un turno en este horario para esta cancha')
        
        # Crear booking
        booking = Booking.objects.create(
            court=court,
            date=date,
            start_time=start_time,
            end_time=end_time,
            status='reserved',
            customer_name=customer_name,
            customer_phone=customer_phone,
            notes=notes,
            created_by=user,
            origin='admin'
        )
        
        return booking
    
    @staticmethod
    @transaction.atomic
    def create_public_booking(court, date, start_time, end_time, customer_name, customer_phone, customer_email=''):
        """
        Crear una reserva pública (sin autenticación) + generar token de cancelación
        """
        # Validar que la cancha esté activa
        if not court.is_active:
            raise ValueError('No se pueden crear turnos en una cancha inactiva')
        
        # Validar horarios
        if end_time <= start_time:
            raise ValueError('La hora de fin debe ser posterior a la hora de inicio')
        
        # Validar overlap
        overlapping = Booking.objects.filter(
            court=court,
            date=date,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exclude(status='cancelled')
        
        if overlapping.exists():
            raise ValueError('Este horario ya no está disponible. Por favor elegí otro.')
        
        # Crear booking
        booking = Booking.objects.create(
            court=court,
            date=date,
            start_time=start_time,
            end_time=end_time,
            status='reserved',
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            origin='public',
            created_by=None
        )
        
        # Generar token de cancelación
        token = CancellationToken.objects.create(booking=booking)
        
        # Notificar a administradores
        Notification.notify_admins(
            title='Nueva reserva online',
            message=f'{customer_name} reservó {court.name} el {date.strftime("%d/%m/%Y")} de {start_time.strftime("%H:%M")} a {end_time.strftime("%H:%M")}',
            notification_type='booking_created',
            booking=booking,
        )
        
        return booking, token
    
    @staticmethod
    def cancel_booking(booking_id, user=None):
        """
        Cancelar un turno (desde panel admin)
        """
        try:
            booking = Booking.objects.get(pk=booking_id)
        except Booking.DoesNotExist:
            raise ValueError('Turno no encontrado')
        
        # Validar que el turno puede ser cancelado
        if not booking.can_be_cancelled:
            raise ValueError(f'No se puede cancelar un turno con estado {booking.get_status_display()}')
        
        # Cambiar status
        booking.status = 'cancelled'
        booking.save(skip_validation=True)
        
        return booking
    
    @staticmethod
    def cancel_booking_with_token(token_str):
        """
        Cancelar reserva con código de cancelación (público)
        Valida anticipación mínima según configuración
        """
        try:
            cancellation_token = CancellationToken.objects.select_related('booking', 'booking__court').get(token=token_str)
        except CancellationToken.DoesNotExist:
            raise ValueError('Código de cancelación no válido')
        
        booking = cancellation_token.booking
        
        # Validar que el turno puede ser cancelado
        if not booking.can_be_cancelled:
            raise ValueError(f'Este turno no puede ser cancelado (estado: {booking.get_status_display()})')
        
        # Validar anticipación mínima
        config = TimeSlotConfiguration.get_active()
        booking_datetime = timezone.make_aware(
            datetime.combine(booking.date, booking.start_time)
        )
        now = timezone.now()
        hours_until_booking = (booking_datetime - now).total_seconds() / 3600
        
        if hours_until_booking < config.min_cancellation_hours:
            raise ValueError(
                f'No se puede cancelar con menos de {config.min_cancellation_hours} horas de anticipación. '
                f'Contactá al club directamente.'
            )
        
        # Cancelar
        booking.status = 'cancelled'
        booking.save(skip_validation=True)
        
        # Notificar a administradores
        Notification.notify_admins(
            title='Reserva cancelada',
            message=f'{booking.customer_name} canceló {booking.court.name} el {booking.date.strftime("%d/%m/%Y")} de {booking.start_time.strftime("%H:%M")} a {booking.end_time.strftime("%H:%M")}',
            notification_type='booking_cancelled',
            booking=booking,
        )
        
        return booking
    
    @staticmethod
    def verify_booking_by_token(token_str):
        """
        Verificar datos de una reserva por su token de cancelación
        """
        try:
            cancellation_token = CancellationToken.objects.select_related('booking', 'booking__court').get(token=token_str)
        except CancellationToken.DoesNotExist:
            raise ValueError('Código de cancelación no válido')
        
        booking = cancellation_token.booking
        config = TimeSlotConfiguration.get_active()
        
        # Calcular si se puede cancelar
        booking_datetime = timezone.make_aware(
            datetime.combine(booking.date, booking.start_time)
        )
        now = timezone.now()
        hours_until_booking = (booking_datetime - now).total_seconds() / 3600
        can_cancel = booking.can_be_cancelled and hours_until_booking >= config.min_cancellation_hours
        
        return {
            'booking': booking,
            'can_cancel': can_cancel,
            'min_cancellation_hours': config.min_cancellation_hours,
            'hours_until_booking': round(hours_until_booking, 1),
        }
    
    @staticmethod
    @transaction.atomic
    def close_booking(booking_id, booking_amount, cash_amount=0, transfer_amount=0, notes='', user=None):
        """
        Cerrar un turno creando el BookingClosure
        """
        try:
            booking = Booking.objects.select_for_update().get(pk=booking_id)
        except Booking.DoesNotExist:
            raise ValueError('Turno no encontrado')
        
        # Validar que el turno puede ser cerrado
        if not booking.can_be_closed:
            raise ValueError(f'Solo se pueden cerrar turnos reservados. Estado actual: {booking.get_status_display()}')
        
        # Validar que no haya sido cerrado previamente
        if hasattr(booking, 'closure'):
            raise ValueError('Este turno ya fue cerrado')
        
        # Calcular monto de consumos
        consumptions_amount = sum(c.total_price for c in booking.consumptions.all())
        
        # Crear closure
        closure = BookingClosure.objects.create(
            booking=booking,
            booking_amount=booking_amount,
            cash_amount=cash_amount,
            transfer_amount=transfer_amount,
            consumptions_amount=consumptions_amount,
            notes=notes,
            closed_by=user
        )
        
        # Cambiar status del booking
        booking.status = 'completed'
        booking.save(skip_validation=True)
        
        return closure
    
    @staticmethod
    def search_bookings_by_customer(name=None, phone=None):
        """
        Buscar reservas activas por nombre o teléfono del cliente.
        Se requiere al menos uno de los dos.
        """
        from django.db.models import Q
        
        queryset = Booking.objects.filter(
            status='reserved'
        ).select_related('court')
        
        # Filtrar por nombre o teléfono (OR)
        q = Q()
        if name and name.strip():
            q |= Q(customer_name__icontains=name.strip())
        if phone and phone.strip():
            q |= Q(customer_phone=phone.strip())
        
        queryset = queryset.filter(q)
        
        # Solo devolver futuras o del día
        today = timezone.now().date()
        queryset = queryset.filter(date__gte=today)
        
        return queryset.order_by('date', 'start_time')
    
    @staticmethod
    def cancel_booking_public(booking_id):
        """
        Cancelar reserva pública por ID
        """
        try:
            booking = Booking.objects.select_related('court').get(pk=booking_id)
        except Booking.DoesNotExist:
            raise ValueError('Reserva no encontrada')
        
        if not booking.can_be_cancelled:
            raise ValueError(f'Este turno no puede ser cancelado (estado: {booking.get_status_display()})')
        
        # Validar anticipación mínima
        config = TimeSlotConfiguration.get_active()
        booking_datetime = timezone.make_aware(
            datetime.combine(booking.date, booking.start_time)
        )
        now = timezone.now()
        hours_until_booking = (booking_datetime - now).total_seconds() / 3600
        
        if hours_until_booking < config.min_cancellation_hours:
            raise ValueError(
                f'No se puede cancelar con menos de {config.min_cancellation_hours} horas de anticipación. '
                f'Contactá al club directamente.'
            )
        
        booking.status = 'cancelled'
        booking.save(skip_validation=True)
        
        # Notificar a administradores
        Notification.notify_admins(
            title='Reserva cancelada',
            message=f'{booking.customer_name} canceló {booking.court.name} el {booking.date.strftime("%d/%m/%Y")} de {booking.start_time.strftime("%H:%M")} a {booking.end_time.strftime("%H:%M")}',
            notification_type='booking_cancelled',
            booking=booking,
        )
        
        return booking

    @staticmethod
    def generate_available_slots(date, court_id=None):
        """
        Generar slots disponibles según configuración global
        Si se proporciona court_id, filtra por esa cancha
        OPTIMIZADO: Una sola query para todos los bookings del día
        """
        from apps.courts.models import Court
        
        config = TimeSlotConfiguration.get_active()
        
        # Obtener canchas
        if court_id:
            courts = Court.objects.filter(id=court_id, is_active=True)
        else:
            courts = Court.objects.filter(is_active=True)
        
        if not courts.exists():
            return []
        
        # OPTIMIZACIÓN: Obtener todos los bookings del día en una sola query
        court_ids = [c.id for c in courts]
        bookings = Booking.objects.filter(
            court_id__in=court_ids,
            date=date
        ).exclude(status='cancelled').values('court_id', 'start_time', 'end_time')
        
        # Crear un dict para búsqueda rápida: {court_id: [bookings]}
        bookings_by_court = {}
        for court in courts:
            bookings_by_court[court.id] = []
        for booking in bookings:
            bookings_by_court[booking['court_id']].append(booking)
        
        slots = []
        current_time = config.opening_time
        end_time = config.closing_time
        now = timezone.now()
        
        while current_time < end_time:
            # Calcular slot_end
            current_dt = datetime.combine(date, current_time)
            slot_end_dt = current_dt + timedelta(minutes=config.slot_duration_minutes)
            slot_end = slot_end_dt.time()
            
            if slot_end > end_time:
                break
            
            for court in courts:
                # Verificar si hay overlap con bookings existentes (en memoria)
                is_available = True
                for booking in bookings_by_court[court.id]:
                    if booking['start_time'] < slot_end and booking['end_time'] > current_time:
                        is_available = False
                        break
                
                # No mostrar slots en el pasado
                slot_datetime = timezone.make_aware(datetime.combine(date, current_time))
                if slot_datetime <= now:
                    is_available = False
                
                slots.append({
                    'court_id': court.id,
                    'court_name': court.name,
                    'court_price': str(court.price),
                    'start_time': current_time.strftime('%H:%M'),
                    'end_time': slot_end.strftime('%H:%M'),
                    'available': is_available,
                })
            
            # Avanzar al siguiente slot
            current_dt += timedelta(minutes=config.slot_duration_minutes)
            current_time = current_dt.time()
        
        return slots
    
    @staticmethod
    def get_available_slots(court, date, slot_duration_minutes=90):
        """
        Obtener slots disponibles para una cancha en una fecha
        (Método legacy, mantener compatibilidad)
        """
        start_hour = 8
        end_hour = 23
        
        slots = []
        current_time = time(start_hour, 0)
        end_time_limit = time(end_hour, 0)
        
        while current_time < end_time_limit:
            current_dt = datetime.combine(date, current_time)
            slot_end_dt = current_dt + timedelta(minutes=slot_duration_minutes)
            slot_end = slot_end_dt.time()
            
            if slot_end > end_time_limit:
                break
            
            overlapping = Booking.objects.filter(
                court=court,
                date=date,
                start_time__lt=slot_end,
                end_time__gt=current_time
            ).exclude(status='cancelled')
            
            is_available = not overlapping.exists()
            
            slots.append({
                'start_time': current_time,
                'end_time': slot_end,
                'available': is_available
            })
            
            current_dt += timedelta(minutes=slot_duration_minutes)
            current_time = current_dt.time()
        
        return slots
