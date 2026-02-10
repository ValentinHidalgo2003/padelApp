from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Product, Consumption
from .serializers import (
    ProductSerializer, ProductListSerializer,
    ConsumptionSerializer, ConsumptionCreateSerializer
)
from apps.users.permissions import IsAdminOrReadOnly, IsAdminOrReception


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de productos
    """
    queryset = Product.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['category', 'name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        """
        Filtrar productos activos por defecto para listados
        """
        queryset = super().get_queryset()
        
        if self.action == 'list':
            # Por defecto mostrar solo activos
            show_all = self.request.query_params.get('show_all', 'false').lower() == 'true'
            if not show_all:
                queryset = queryset.filter(is_active=True)
        
        return queryset


class ConsumptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de consumos
    """
    queryset = Consumption.objects.select_related('booking', 'product')
    permission_classes = [IsAdminOrReception]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['booking', 'product']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConsumptionCreateSerializer
        return ConsumptionSerializer
    
    def perform_create(self, serializer):
        """
        Crear consumo con precio del producto si no se especifica
        """
        product = serializer.validated_data.get('product')
        if 'unit_price' not in serializer.validated_data:
            serializer.save(unit_price=product.price)
        else:
            serializer.save()
