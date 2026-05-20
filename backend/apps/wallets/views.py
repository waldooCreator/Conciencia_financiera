"""
Views for Wallet CRUD operations.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Wallet
from .serializers import WalletSerializer


class WalletViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing wallets.
    Users can only access their own wallets.
    """
    serializer_class = WalletSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Return only the current user's wallets."""
        return Wallet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create wallet associated with the current user."""
        serializer.save(user=self.request.user)
