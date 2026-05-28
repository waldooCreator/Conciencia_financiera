"""
Views for Category CRUD operations.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category
from .serializers import CategorySerializer

# Default categories with app-palette colors
DEFAULT_CATEGORIES = [
    {'name': 'Hormiga', 'color_hex': '#e74c3c', 'description': 'Gastos pequeños del día a día'},
    {'name': 'Imprevisto', 'color_hex': '#f39c12', 'description': 'Gastos inesperados o emergencias'},
    {'name': 'Fijo', 'color_hex': '#20394a', 'description': 'Gastos recurrentes mensuales'},
    {'name': 'Comida', 'color_hex': '#2ecc71', 'description': 'Alimentación y restaurantes'},
    {'name': 'Transporte', 'color_hex': '#6196aa', 'description': 'Movilidad, gasolina, pasajes'},
    {'name': 'Entretenimiento', 'color_hex': '#9b59b6', 'description': 'Ocio, streaming, salidas'},
    {'name': 'Salud', 'color_hex': '#1abc9c', 'description': 'Medicinas, consultas, seguro'},
    {'name': 'Compras', 'color_hex': '#e67e22', 'description': 'Ropa, tecnología, hogar'},
]


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

    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        """
        Create default categories for the current user.
        Skips any category name that already exists for this user.
        Returns the list of created (or existing) categories.
        """
        user = request.user
        existing_names = set(
            Category.objects.filter(user=user).values_list('name', flat=True)
        )

        created = []
        skipped = []

        for cat_data in DEFAULT_CATEGORIES:
            if cat_data['name'] in existing_names:
                skipped.append(cat_data['name'])
                continue
            Category.objects.create(
                user=user,
                name=cat_data['name'],
                color_hex=cat_data['color_hex'],
                is_default=True,
            )
            created.append(cat_data['name'])

        # Return all categories (existing + newly created)
        all_categories = Category.objects.filter(user=user)
        serializer = self.get_serializer(all_categories, many=True)

        return Response({
            'created': created,
            'skipped': skipped,
            'categories': serializer.data,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
