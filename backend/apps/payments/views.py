from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, date
from .services import ReportService
from apps.users.permissions import IsAdminOrReception


class DailySummaryView(APIView):
    """
    Vista para resumen diario de caja
    """
    permission_classes = [IsAdminOrReception]
    
    def get(self, request):
        """
        Obtener resumen diario
        Query params: date (YYYY-MM-DD)
        """
        date_str = request.query_params.get('date')
        
        if not date_str:
            # Si no se especifica fecha, usar hoy
            target_date = date.today()
        else:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Usar YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        summary = ReportService.get_daily_summary(target_date)
        return Response(summary)


class HistoryView(APIView):
    """
    Vista para historial de turnos con filtros
    """
    permission_classes = [IsAdminOrReception]
    
    def get(self, request):
        """
        Obtener historial de turnos
        Query params: date_from, date_to, court, status
        """
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        court_id = request.query_params.get('court')
        status_filter = request.query_params.get('status')
        
        try:
            history = ReportService.get_history(
                date_from=date_from,
                date_to=date_to,
                court_id=court_id,
                status=status_filter
            )
            return Response(history)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class MonthlySummaryView(APIView):
    """
    Vista para resumen mensual
    """
    permission_classes = [IsAdminOrReception]
    
    def get(self, request):
        """
        Obtener resumen mensual
        Query params: year, month
        """
        try:
            year = int(request.query_params.get('year', date.today().year))
            month = int(request.query_params.get('month', date.today().month))
        except ValueError:
            return Response(
                {'error': 'Parámetros year y month deben ser números'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if month < 1 or month > 12:
            return Response(
                {'error': 'Mes debe estar entre 1 y 12'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        summary = ReportService.get_monthly_summary(year, month)
        return Response(summary)
