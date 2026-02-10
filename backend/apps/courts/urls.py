from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourtViewSet

router = DefaultRouter()
router.register(r'', CourtViewSet, basename='court')

urlpatterns = [
    path('', include(router.urls)),
]
