from django.contrib import admin
from .models import Booking, BookingClosure, CancellationToken


class BookingClosureInline(admin.StackedInline):
    model = BookingClosure
    extra = 0
    readonly_fields = ['closed_at', 'total_amount']


class CancellationTokenInline(admin.StackedInline):
    model = CancellationToken
    extra = 0
    readonly_fields = ['token', 'created_at']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['court', 'date', 'start_time', 'end_time', 'status', 'customer_name', 'origin', 'created_at']
    list_filter = ['status', 'court', 'date', 'origin']
    search_fields = ['customer_name', 'customer_phone', 'customer_email']
    readonly_fields = ['created_at', 'updated_at', 'duration_minutes']
    inlines = [CancellationTokenInline, BookingClosureInline]
    
    fieldsets = (
        ('Información del Turno', {
            'fields': ('court', 'date', 'start_time', 'end_time', 'status', 'origin')
        }),
        ('Cliente', {
            'fields': ('customer_name', 'customer_phone', 'customer_email', 'notes')
        }),
        ('Información del Sistema', {
            'fields': ('created_by', 'created_at', 'updated_at', 'duration_minutes'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BookingClosure)
class BookingClosureAdmin(admin.ModelAdmin):
    list_display = ['booking', 'cash_amount', 'transfer_amount', 'booking_amount', 'consumptions_amount', 'total_amount', 'closed_at']
    list_filter = ['closed_at']
    search_fields = ['booking__customer_name']
    readonly_fields = ['closed_at', 'total_amount']


@admin.register(CancellationToken)
class CancellationTokenAdmin(admin.ModelAdmin):
    list_display = ['token', 'booking', 'created_at']
    search_fields = ['token', 'booking__customer_name']
    readonly_fields = ['token', 'created_at']
