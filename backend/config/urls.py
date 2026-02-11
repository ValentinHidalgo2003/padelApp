from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.courts.config_views import (
    get_configuration, update_configuration,
    get_court_prices, update_court_price,
)

def health_check(request):
    """Health check endpoint for monitoring"""
    return JsonResponse({'status': 'ok', 'service': 'padelapp-backend'})

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check (for monitoring/load balancer)
    path('api/health/', health_check, name='health-check'),
    
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/auth/', include('apps.users.urls')),
    path('api/courts/', include('apps.courts.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/consumptions/', include('apps.products.urls_consumptions')),
    path('api/reports/', include('apps.payments.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    
    # Public API (sin autenticación)
    path('api/public/', include('apps.bookings.public_urls')),
    
    # Configuration API (para panel admin)
    path('api/config/', get_configuration, name='config-get'),
    path('api/config/update/', update_configuration, name='config-update'),
    path('api/config/courts/', get_court_prices, name='config-courts'),
    path('api/config/courts/<int:pk>/price/', update_court_price, name='config-court-price'),
]
