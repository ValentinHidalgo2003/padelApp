from rest_framework import serializers
from .models import Court


class CourtSerializer(serializers.ModelSerializer):
    """
    Serializer para canchas
    """
    court_type_display = serializers.CharField(source='get_court_type_display', read_only=True)
    
    class Meta:
        model = Court
        fields = ['id', 'name', 'court_type', 'court_type_display', 'price', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """
        Validar que el nombre sea único
        """
        # En update, excluir la instancia actual
        if self.instance:
            if Court.objects.exclude(pk=self.instance.pk).filter(name=value).exists():
                raise serializers.ValidationError('Ya existe una cancha con este nombre')
        else:
            if Court.objects.filter(name=value).exists():
                raise serializers.ValidationError('Ya existe una cancha con este nombre')
        return value


class CourtListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados
    """
    court_type_display = serializers.CharField(source='get_court_type_display', read_only=True)
    
    class Meta:
        model = Court
        fields = ['id', 'name', 'court_type', 'court_type_display', 'price', 'is_active']
