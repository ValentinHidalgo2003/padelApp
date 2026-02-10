from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from apps.users.permissions import IsAdminOrReception
from .models import TimeSlotConfiguration, Court
from .config_serializers import TimeSlotConfigurationSerializer, CourtPriceSerializer


@api_view(['GET'])
@permission_classes([IsAdminOrReception])
def get_configuration(request):
    """
    Obtener configuración actual de horarios
    """
    config = TimeSlotConfiguration.get_active()
    serializer = TimeSlotConfigurationSerializer(config)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminOrReception])
def update_configuration(request):
    """
    Actualizar configuración de horarios
    """
    config = TimeSlotConfiguration.get_active()
    partial = request.method == 'PATCH'
    serializer = TimeSlotConfigurationSerializer(config, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminOrReception])
def get_court_prices(request):
    """
    Listar canchas con precios para configuración
    """
    courts = Court.objects.all().order_by('name')
    serializer = CourtPriceSerializer(courts, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminOrReception])
def update_court_price(request, pk):
    """
    Actualizar precio de una cancha
    """
    try:
        court = Court.objects.get(pk=pk)
    except Court.DoesNotExist:
        return Response(
            {'error': 'Cancha no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = CourtPriceSerializer(court, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
