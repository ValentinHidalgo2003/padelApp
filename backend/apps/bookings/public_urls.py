from django.urls import path
from .public_views import (
    public_courts_list,
    public_available_slots,
    public_create_booking,
    public_cancel_booking,
    public_verify_booking,
    public_search_bookings,
    public_cancel_booking_by_id,
    public_configuration,
)

urlpatterns = [
    path('courts/', public_courts_list, name='public-courts'),
    path('available-slots/', public_available_slots, name='public-available-slots'),
    path('bookings/', public_create_booking, name='public-create-booking'),
    path('bookings/cancel/', public_cancel_booking, name='public-cancel-booking'),
    path('bookings/verify/', public_verify_booking, name='public-verify-booking'),
    path('bookings/search/', public_search_bookings, name='public-search-bookings'),
    path('bookings/cancel-by-id/', public_cancel_booking_by_id, name='public-cancel-booking-by-id'),
    path('configuration/', public_configuration, name='public-configuration'),
]
