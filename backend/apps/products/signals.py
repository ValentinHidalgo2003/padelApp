from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Consumption


@receiver([post_save, post_delete], sender=Consumption)
def update_booking_closure_consumptions_amount(sender, instance, **kwargs):
    """
    Actualiza el monto de consumos en el cierre del turno
    cuando se crea o elimina un consumo
    """
    booking = instance.booking
    
    # Verificar si el turno tiene un cierre
    if hasattr(booking, 'closure'):
        # Calcular total de consumos
        total_consumptions = sum(
            c.total_price for c in booking.consumptions.all()
        )
        
        # Actualizar closure
        closure = booking.closure
        closure.consumptions_amount = total_consumptions
        closure.save()
