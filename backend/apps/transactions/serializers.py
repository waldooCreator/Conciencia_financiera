"""
Serializers for Transaction model.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Transaction
from apps.wallets.models import Wallet


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for the Transaction model."""
    installment_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    remaining_installments = serializers.IntegerField(read_only=True)
    wallet_name = serializers.CharField(source='wallet.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = (
            'id', 'user', 'wallet', 'wallet_name', 'category', 'category_name',
            'amount', 'type', 'description', 'installments',
            'current_installment', 'date', 'is_synced',
            'installment_amount', 'remaining_installments',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
        extra_kwargs = {
            'date': {'required': False},
        }

    def validate(self, data):
        """Validate transaction data based on type and wallet."""
        wallet = data.get('wallet')
        transaction_type = data.get('type')
        amount = data.get('amount')

        if wallet and transaction_type:
            if wallet.user != self.context['request'].user:
                raise serializers.ValidationError({
                    'wallet': 'Solo puedes usar tus propios medios de pago'
                })

            # For expenses, check sufficient funds
            if transaction_type == Transaction.TransactionType.EXPENSE:
                if wallet.type == Wallet.WalletType.CREDIT:
                    available = wallet.credit_limit - wallet.balance if wallet.credit_limit else None
                    if available is not None and amount > available:
                        raise serializers.ValidationError({
                            'amount': 'Crédito insuficiente'
                        })
                else:
                    if amount > wallet.balance:
                        raise serializers.ValidationError({
                            'amount': 'Saldo insuficiente'
                        })

        return data

    def create(self, validated_data):
        """Create transaction and update wallet balance realistically."""
        user = self.context['request'].user
        validated_data['user'] = user

        if 'date' not in validated_data or not validated_data.get('date'):
            validated_data['date'] = timezone.now()

        wallet = validated_data['wallet']
        transaction_type = validated_data['type']
        amount = validated_data['amount']

        # Realistic balance logic:
        # INCOME → balance increases for ALL wallets
        # EXPENSE with CASH/DEBIT → balance decreases
        # EXPENSE with CREDIT → balance increases (balance = debt owed)
        if transaction_type == Transaction.TransactionType.INCOME:
            wallet.balance += amount
        elif transaction_type == Transaction.TransactionType.EXPENSE:
            if wallet.type == Wallet.WalletType.CREDIT:
                wallet.balance += amount  # Credit card debt increases
            else:
                wallet.balance -= amount  # Cash/Debit balance decreases

        wallet.save()
        return super().create(validated_data)
