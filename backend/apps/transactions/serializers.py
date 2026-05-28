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
        max_digits=12, decimal_places=2, read_only=True
    )
    remaining_installments = serializers.IntegerField(read_only=True)
    wallet_name = serializers.CharField(source='wallet.name', read_only=True)
    destination_wallet_name = serializers.CharField(
        source='destination_wallet.name', read_only=True, allow_null=True
    )
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = (
            'id', 'user', 'wallet', 'wallet_name',
            'destination_wallet', 'destination_wallet_name',
            'category', 'category_name',
            'amount', 'type', 'description', 'installments',
            'current_installment', 'date', 'is_synced',
            'installment_amount', 'remaining_installments',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
        extra_kwargs = {'date': {'required': False}}

    # ─── VALIDATION ─────────────────────────────
    def validate(self, data):
        wallet = data.get('wallet')
        transaction_type = data.get('type')
        amount = data.get('amount')
        destination_wallet = data.get('destination_wallet')

        if wallet and wallet.user != self.context['request'].user:
            raise serializers.ValidationError({
                'wallet': 'Solo puedes usar tus propios medios de pago.'
            })

        # ── TRANSFER ──
        if transaction_type == Transaction.TransactionType.TRANSFER:
            if not destination_wallet:
                raise serializers.ValidationError({
                    'destination_wallet': 'Selecciona una cuenta de destino para la transferencia.'
                })
            if destination_wallet.user != self.context['request'].user:
                raise serializers.ValidationError({
                    'destination_wallet': 'La cuenta de destino debe ser tuya.'
                })
            if wallet == destination_wallet:
                raise serializers.ValidationError({
                    'destination_wallet': 'El origen y el destino no pueden ser la misma cuenta.'
                })

            # Source validation
            if wallet.type == Wallet.WalletType.CREDIT:
                if not wallet.credit_limit:
                    raise serializers.ValidationError({
                        'wallet': 'Esta tarjeta no tiene un límite de crédito asignado. Edítala en Cuentas para definir uno.'
                    })
                available = wallet.credit_limit - wallet.balance
                if amount > available:
                    raise serializers.ValidationError({
                        'amount': (
                            f'No tienes suficiente crédito disponible.\n\n'
                            f'• Quieres retirar: ${amount:,.0f}\n'
                            f'• Crédito disponible: ${available:,.0f}\n'
                            f'• Deuda actual: ${wallet.balance:,.0f}\n'
                            f'• Límite total: ${wallet.credit_limit:,.0f}'
                        )
                    })
            else:
                if amount > wallet.balance:
                    raise serializers.ValidationError({
                        'amount': (
                            f'Saldo insuficiente en {wallet.name}.\n\n'
                            f'• Quieres transferir: ${amount:,.0f}\n'
                            f'• Saldo disponible: ${wallet.balance:,.0f}\n\n'
                            f'La diferencia es de ${amount - wallet.balance:,.0f}.'
                        )
                    })

            # Destination validation - paying credit card
            if destination_wallet.type == Wallet.WalletType.CREDIT:
                if amount > destination_wallet.balance:
                    raise serializers.ValidationError({
                        'amount': (
                            f'No puedes pagar más de lo que debes en {destination_wallet.name}.\n\n'
                            f'• Intentas pagar: ${amount:,.0f}\n'
                            f'• Deuda actual: ${destination_wallet.balance:,.0f}\n'
                            f'• Excedente: ${amount - destination_wallet.balance:,.0f}\n\n'
                            f'Paga exactamente la deuda o un monto menor.'
                        )
                    })

            return data

        # ── EXPENSE ──
        if transaction_type == Transaction.TransactionType.EXPENSE:
            if wallet.type == Wallet.WalletType.CREDIT:
                if not wallet.credit_limit:
                    raise serializers.ValidationError({
                        'wallet': 'Esta tarjeta no tiene un límite de crédito. Defínelo en la sección Cuentas.'
                    })
                available = wallet.credit_limit - wallet.balance
                if amount > available:
                    raise serializers.ValidationError({
                        'amount': (
                            f'No tienes suficiente crédito disponible en {wallet.name}.\n\n'
                            f'• Gasto: ${amount:,.0f}\n'
                            f'• Crédito disponible: ${available:,.0f}\n'
                            f'• Deuda actual: ${wallet.balance:,.0f}\n'
                            f'• Límite: ${wallet.credit_limit:,.0f}'
                        )
                    })
            else:
                if amount > wallet.balance:
                    raise serializers.ValidationError({
                        'amount': (
                            f'Saldo insuficiente en {wallet.name}.\n\n'
                            f'• Gasto: ${amount:,.0f}\n'
                            f'• Saldo disponible: ${wallet.balance:,.0f}\n\n'
                            f'Te faltan ${amount - wallet.balance:,.0f}.'
                        )
                    })

        return data

    # ─── BALANCE EFFECTS ───────────────────────
    def _apply_balance_effect(self, wallet, transaction_type, amount, reverse=False):
        multiplier = -1 if reverse else 1

        if transaction_type == Transaction.TransactionType.INCOME:
            if wallet.type == Wallet.WalletType.CREDIT:
                wallet.balance -= amount * multiplier  # refund reduces debt
            else:
                wallet.balance += amount * multiplier
        elif transaction_type == Transaction.TransactionType.EXPENSE:
            if wallet.type == Wallet.WalletType.CREDIT:
                wallet.balance += amount * multiplier  # debt increases
            else:
                wallet.balance -= amount * multiplier

    def _apply_transfer_balance(self, source, destination, amount, reverse=False):
        multiplier = -1 if reverse else 1

        if source.type == Wallet.WalletType.CREDIT:
            source.balance += amount * multiplier
        else:
            source.balance -= amount * multiplier

        if destination.type == Wallet.WalletType.CREDIT:
            destination.balance -= amount * multiplier  # paying off debt
        else:
            destination.balance += amount * multiplier

    # ─── CREATE / UPDATE ───────────────────────
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user

        if 'date' not in validated_data or not validated_data.get('date'):
            validated_data['date'] = timezone.now()

        transaction_type = validated_data['type']
        amount = validated_data['amount']
        wallet = validated_data['wallet']

        if transaction_type == Transaction.TransactionType.TRANSFER:
            destination = validated_data.pop('destination_wallet')
            self._apply_transfer_balance(wallet, destination, amount)
            wallet.save()
            destination.save()
            instance = super().create(validated_data)
            instance.destination_wallet = destination
            instance.save(update_fields=['destination_wallet'])
            return instance
        else:
            self._apply_balance_effect(wallet, transaction_type, amount)
            wallet.save()
            return super().create(validated_data)

    def update(self, instance, validated_data):
        old_wallet = instance.wallet
        old_type = instance.type
        old_amount = instance.amount
        old_destination = instance.destination_wallet

        new_wallet = validated_data.get('wallet', old_wallet)
        new_type = validated_data.get('type', old_type)
        new_amount = validated_data.get('amount', old_amount)
        new_destination = validated_data.get('destination_wallet', old_destination)

        if old_type == Transaction.TransactionType.TRANSFER and old_destination:
            self._apply_transfer_balance(old_wallet, old_destination, old_amount, reverse=True)
            old_destination.save()
        else:
            self._apply_balance_effect(old_wallet, old_type, old_amount, reverse=True)

        old_wallet.save()

        if new_type == Transaction.TransactionType.TRANSFER and new_destination:
            self._apply_transfer_balance(new_wallet, new_destination, new_amount)
            new_destination.save()
        else:
            self._apply_balance_effect(new_wallet, new_type, new_amount)

        if old_wallet != new_wallet:
            new_wallet.save()

        return super().update(instance, validated_data)
