from django.urls import path
from .views import DailySummaryView, HistoryView, MonthlySummaryView

urlpatterns = [
    path('daily-summary/', DailySummaryView.as_view(), name='daily-summary'),
    path('history/', HistoryView.as_view(), name='history'),
    path('monthly-summary/', MonthlySummaryView.as_view(), name='monthly-summary'),
]
