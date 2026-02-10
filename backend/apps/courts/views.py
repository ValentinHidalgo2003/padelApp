from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Court
from .serializers import CourtSerializer, CourtListSerializer
from apps.users.permissions import IsAdminOrReadOnly


class CourtViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de canchas
    """
    queryset = Court.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'court_type']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourtListSerializer
        return CourtSerializer
    
    def get_queryset(self):
        """
        Filtrar canchas activas por defecto para usuarios no admin
        """
        queryset = super().get_queryset()
        
        # Si el usuario no es admin, mostrar solo activas
        if not self.request.user.is_admin and self.action == 'list':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        """
        Activar/desactivar una cancha
        """
        court = self.get_object()
        court.is_active = not court.is_active
        court.save()
        
        serializer = self.get_serializer(court)
        return Response(serializer.data)
