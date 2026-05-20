"""
Serializers for Category model.
"""
from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for the Category model."""

    class Meta:
        model = Category
        fields = (
            'id', 'user', 'name', 'color_hex',
            'is_default', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def create(self, validated_data):
        """Create a new category associated with the current user."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
