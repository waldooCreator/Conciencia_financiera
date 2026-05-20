"""
Serializers for SavingsGoal model.
"""
from rest_framework import serializers
from .models import SavingsGoal


class SavingsGoalSerializer(serializers.ModelSerializer):
    """Serializer for the SavingsGoal model."""
    progress_percentage = serializers.FloatField(read_only=True)
    remaining_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = SavingsGoal
        fields = (
            'id', 'user', 'name', 'target_amount', 'current_amount',
            'deadline', 'progress_percentage', 'remaining_amount',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def create(self, validated_data):
        """Create a new savings goal associated with the current user."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
