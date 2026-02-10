from django.urls import path
from .views import (
    notification_list,
    notification_mark_read,
    notification_mark_all_read,
    notification_unread_count,
)

urlpatterns = [
    path('', notification_list, name='notification-list'),
    path('<int:pk>/read/', notification_mark_read, name='notification-mark-read'),
    path('mark-all-read/', notification_mark_all_read, name='notification-mark-all-read'),
    path('unread-count/', notification_unread_count, name='notification-unread-count'),
]
