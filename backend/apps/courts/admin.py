from django.contrib import admin
from .models import Court, TimeSlotConfiguration


@admin.register(Court)
class CourtAdmin(admin.ModelAdmin):
    list_display = ['name', 'court_type', 'price', 'is_active', 'created_at']
    list_filter = ['court_type', 'is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['price']


@admin.register(TimeSlotConfiguration)
class TimeSlotConfigurationAdmin(admin.ModelAdmin):
    list_display = ['opening_time', 'closing_time', 'slot_duration_minutes', 'min_cancellation_hours', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
