from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """
    Listar notificaciones del usuario (más recientes primero)
    """
    notifications = Notification.objects.filter(
        recipient=request.user
    ).order_by('-created_at')[:50]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, pk):
    """
    Marcar una notificación como leída
    """
    try:
        notification = Notification.objects.get(pk=pk, recipient=request.user)
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notificación no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    notification.is_read = True
    notification.save()
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    """
    Marcar todas las notificaciones como leídas
    """
    Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).update(is_read=True)
    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_unread_count(request):
    """
    Obtener cantidad de notificaciones no leídas
    """
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    return Response({'unread_count': count})
