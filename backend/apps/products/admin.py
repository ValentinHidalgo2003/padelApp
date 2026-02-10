from django.contrib import admin
from .models import Product, Consumption


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Consumption)
class ConsumptionAdmin(admin.ModelAdmin):
    list_display = ['booking', 'product', 'quantity', 'unit_price', 'total_price', 'created_at']
    list_filter = ['created_at', 'product']
    search_fields = ['booking__customer_name', 'product__name']
    readonly_fields = ['created_at', 'total_price']
