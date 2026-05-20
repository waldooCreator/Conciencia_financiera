"""
Views for Category CRUD operations.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing categories.
    Users can only access their own categories.
    """
    serializer_class = CategorySerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Return only the current user's categories."""
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create category associated with the current user."""
        serializer.save(user=self.request.user)
