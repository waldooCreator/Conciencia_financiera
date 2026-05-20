"""
URL configuration for Finanzas Personales project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from apps.users.tokens import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Health check
    path('api/', include('apps.health.urls')),
    # JWT Authentication (custom)
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # API endpoints
    path('api/users/', include('apps.users.urls')),
    path('api/wallets/', include('apps.wallets.urls')),
    path('api/transactions/', include('apps.transactions.urls')),
    path('api/categories/', include('apps.categories.urls')),
    path('api/goals/', include('apps.goals.urls')),
]
