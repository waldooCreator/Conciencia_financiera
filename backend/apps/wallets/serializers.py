"""
Serializers for Wallet model.
"""
from rest_framework import serializers
from .models import Wallet


class WalletSerializer(serializers.ModelSerializer):
    """Serializer for the Wallet model."""
    available_credit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Wallet
        fields = (
            'id', 'user', 'name', 'type', 'balance',
            'credit_limit', 'billing_cycle_date',
            'available_credit', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def create(self, validated_data):
        """Create a new wallet associated with the current user."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
