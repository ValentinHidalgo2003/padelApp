from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permiso para administradores
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class IsAdminOrReception(permissions.BasePermission):
    """
    Permiso para administradores o recepcionistas
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_admin or request.user.is_reception
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso de solo lectura para todos los autenticados, 
    escritura solo para administradores
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.is_admin
