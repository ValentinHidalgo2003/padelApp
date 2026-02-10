from django.db.models import Sum, Count, Q
from datetime import date, datetime
from apps.bookings.models import BookingClosure, Booking


class ReportService:
    """
    Servicio para generación de reportes
    """
    
    @staticmethod
    def get_daily_summary(target_date):
        """
        Obtener resumen diario de facturación
        """
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
        
        # Obtener todos los cierres del día
        closures = BookingClosure.objects.filter(
            booking__date=target_date
        ).select_related('booking', 'booking__court')
        
        if not closures.exists():
            return {
                'date': target_date.isoformat(),
                'total_amount': 0,
                'total_bookings': 0,
                'total_booking_amount': 0,
                'total_consumptions_amount': 0,
                'by_payment_method': [],
                'bookings': []
            }
        
        # Calcular totales
        totals = closures.aggregate(
            total_amount=Sum('total_amount'),
            total_booking_amount=Sum('booking_amount'),
            total_consumptions_amount=Sum('consumptions_amount'),
            count=Count('id')
        )
        
        # Agrupar por método de pago (efectivo y transferencia)
        total_cash = 0
        total_transfer = 0
        for closure in closures:
            total_cash += float(closure.cash_amount)
            total_transfer += float(closure.transfer_amount)
        
        payment_methods = {}
        if total_cash > 0:
            payment_methods['cash'] = {
                'method': 'cash',
                'method_display': 'Efectivo',
                'total': total_cash,
                'count': sum(1 for c in closures if c.cash_amount > 0)
            }
        if total_transfer > 0:
            payment_methods['transfer'] = {
                'method': 'transfer',
                'method_display': 'Transferencia',
                'total': total_transfer,
                'count': sum(1 for c in closures if c.transfer_amount > 0)
            }
        
        # Detalle de turnos cerrados
        bookings_detail = []
        for closure in closures:
            bookings_detail.append({
                'booking_id': closure.booking.id,
                'court_name': closure.booking.court.name,
                'time': f"{closure.booking.start_time.strftime('%H:%M')}-{closure.booking.end_time.strftime('%H:%M')}",
                'customer_name': closure.booking.customer_name,
                'cash_amount': float(closure.cash_amount),
                'transfer_amount': float(closure.transfer_amount),
                'payment_summary': closure.payment_summary,
                'booking_amount': float(closure.booking_amount),
                'consumptions_amount': float(closure.consumptions_amount),
                'total_amount': float(closure.total_amount),
                'closed_at': closure.closed_at.isoformat()
            })
        
        return {
            'date': target_date.isoformat(),
            'total_amount': float(totals['total_amount'] or 0),
            'total_bookings': totals['count'],
            'total_booking_amount': float(totals['total_booking_amount'] or 0),
            'total_consumptions_amount': float(totals['total_consumptions_amount'] or 0),
            'by_payment_method': list(payment_methods.values()),
            'bookings': bookings_detail
        }
    
    @staticmethod
    def get_history(date_from=None, date_to=None, court_id=None, status=None):
        """
        Obtener historial de turnos con filtros
        """
        queryset = Booking.objects.select_related(
            'court', 'created_by', 'closure'
        ).prefetch_related('consumptions')
        
        # Aplicar filtros
        if date_from:
            if isinstance(date_from, str):
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(date__gte=date_from)
        
        if date_to:
            if isinstance(date_to, str):
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(date__lte=date_to)
        
        if court_id:
            queryset = queryset.filter(court_id=court_id)
        
        if status:
            queryset = queryset.filter(status=status)
        
        # Ordenar por fecha descendente
        queryset = queryset.order_by('-date', '-start_time')
        
        # Construir respuesta
        results = []
        for booking in queryset:
            item = {
                'id': booking.id,
                'court_name': booking.court.name,
                'date': booking.date.isoformat(),
                'start_time': booking.start_time.strftime('%H:%M'),
                'end_time': booking.end_time.strftime('%H:%M'),
                'status': booking.status,
                'status_display': booking.get_status_display(),
                'customer_name': booking.customer_name,
                'customer_phone': booking.customer_phone,
                'created_at': booking.created_at.isoformat(),
            }
            
            # Agregar información de cierre si existe
            if hasattr(booking, 'closure'):
                closure = booking.closure
                item['closure'] = {
                    'cash_amount': float(closure.cash_amount),
                    'transfer_amount': float(closure.transfer_amount),
                    'payment_summary': closure.payment_summary,
                    'total_amount': float(closure.total_amount),
                    'booking_amount': float(closure.booking_amount),
                    'consumptions_amount': float(closure.consumptions_amount),
                    'closed_at': closure.closed_at.isoformat()
                }
            else:
                item['closure'] = None
            
            results.append(item)
        
        return results
    
    @staticmethod
    def get_monthly_summary(year, month):
        """
        Resumen mensual (utilidad futura)
        """
        from calendar import monthrange
        
        # Calcular primer y último día del mes
        first_day = date(year, month, 1)
        last_day = date(year, month, monthrange(year, month)[1])
        
        # Obtener cierres del mes
        closures = BookingClosure.objects.filter(
            booking__date__gte=first_day,
            booking__date__lte=last_day
        )
        
        totals = closures.aggregate(
            total_amount=Sum('total_amount'),
            total_booking_amount=Sum('booking_amount'),
            total_consumptions_amount=Sum('consumptions_amount'),
            count=Count('id')
        )
        
        # Resumen por día
        daily_summaries = []
        current_date = first_day
        while current_date <= last_day:
            daily = ReportService.get_daily_summary(current_date)
            if daily['total_bookings'] > 0:
                daily_summaries.append(daily)
            current_date = date(current_date.year, current_date.month, current_date.day + 1)
        
        return {
            'year': year,
            'month': month,
            'total_amount': float(totals['total_amount'] or 0),
            'total_bookings': totals['count'],
            'total_booking_amount': float(totals['total_booking_amount'] or 0),
            'total_consumptions_amount': float(totals['total_consumptions_amount'] or 0),
            'daily_summaries': daily_summaries
        }
