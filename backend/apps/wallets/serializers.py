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

    def validate(self, data):
        """Validate wallet data."""
        wallet_type = data.get('type', self.instance.type if self.instance else None)

        # FIX #5: Credit cards MUST have a credit limit
        if wallet_type == Wallet.WalletType.CREDIT:
            credit_limit = data.get('credit_limit')
            # For updates, check instance if not provided
            if credit_limit is None and self.instance:
                credit_limit = self.instance.credit_limit
            if not credit_limit or credit_limit <= 0:
                raise serializers.ValidationError({
                    'credit_limit': 'Las tarjetas de crédito requieren un límite de crédito mayor a 0'
                })

        # Credit cards should not have a positive initial balance (debt) without a limit
        if wallet_type == Wallet.WalletType.CREDIT:
            balance = data.get('balance', self.instance.balance if self.instance else 0)
            credit_limit = data.get('credit_limit', self.instance.credit_limit if self.instance else 0)
            if credit_limit and balance > credit_limit:
                raise serializers.ValidationError({
                    'balance': 'La deuda no puede superar el límite de crédito'
                })

        # Billing cycle day must be between 1 and 31
        billing_day = data.get('billing_cycle_date')
        if billing_day is not None and (billing_day < 1 or billing_day > 31):
            raise serializers.ValidationError({
                'billing_cycle_date': 'El día de corte debe estar entre 1 y 31'
            })

        return data

    def create(self, validated_data):
        """Create a new wallet associated with the current user."""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)
