"""
Views for Transaction CRUD operations.
"""
from datetime import timedelta
from collections import defaultdict
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from .models import Transaction
from .serializers import TransactionSerializer
from apps.wallets.models import Wallet
from apps.categories.models import Category


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transactions."""
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # ──────────────────────────────────────────────
    # DESTROY (FIX #3 + #7)
    # ──────────────────────────────────────────────
    def perform_destroy(self, instance):
        """
        Reverse wallet balances when deleting a transaction.
        Uses the same balance-effect logic as the serializer for consistency.
        """
        wallet = instance.wallet
        amount = instance.amount

        if instance.type == Transaction.TransactionType.TRANSFER and instance.destination_wallet:
            # Use same logic as serializer._apply_transfer_balance (FIX #7: no duplication)
            destination = instance.destination_wallet

            # Reverse source
            if wallet.type == Wallet.WalletType.CREDIT:
                wallet.balance -= amount  # Reverse debt increase
            else:
                wallet.balance += amount  # Give money back

            # Reverse destination
            if destination.type == Wallet.WalletType.CREDIT:
                destination.balance += amount  # Restore debt
            else:
                destination.balance -= amount  # Take money back

            wallet.save()
            destination.save()

        elif instance.type == Transaction.TransactionType.INCOME:
            # FIX #3: distinguish wallet type
            if wallet.type == Wallet.WalletType.CREDIT:
                wallet.balance += amount  # Reverse debt reduction (income reduced debt)
            else:
                wallet.balance -= amount  # Reverse balance increase
            wallet.save()

        elif instance.type == Transaction.TransactionType.EXPENSE:
            if wallet.type == Wallet.WalletType.CREDIT:
                wallet.balance -= amount  # Reverse debt increase
            else:
                wallet.balance += amount  # Reverse balance decrease
            wallet.save()

        instance.delete()

    # ──────────────────────────────────────────────
    # SUMMARY (FIX #6)
    # ──────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get transaction summary for the current month.
        Returns total income, total expenses, and net balance.
        Income to credit cards (refunds) is excluded from income and subtracted from expenses
        since it represents debt reduction.
        """
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=start_of_month
        )

        # Income to non-credit wallets = real income
        real_income = transactions.filter(
            type=Transaction.TransactionType.INCOME
        ).exclude(
            wallet__type=Wallet.WalletType.CREDIT
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Income to credit cards = refunds (debt reduction)
        credit_refunds = transactions.filter(
            type=Transaction.TransactionType.INCOME,
            wallet__type=Wallet.WalletType.CREDIT
        ).aggregate(total=Sum('amount'))['total'] or 0

        # All expenses
        total_expenses = transactions.filter(
            type=Transaction.TransactionType.EXPENSE
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Credit card debt at month start (approximation)
        credit_wallets = Wallet.objects.filter(user=request.user, type=Wallet.WalletType.CREDIT)
        total_credit_debt = credit_wallets.aggregate(total=Sum('balance'))['total'] or 0

        return Response({
            'period': now.strftime('%Y-%m'),
            'total_income': float(real_income),
            'total_expenses': float(total_expenses),
            'credit_refunds': float(credit_refunds),
            'balance': float(real_income - total_expenses),
            'total_credit_debt': float(total_credit_debt),
            'transaction_count': transactions.count()
        })

    # ──────────────────────────────────────────────
    # COMPARISON
    # ──────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def comparison(self, request):
        """
        Compare expenses by category between current month and previous month.
        """
        now = timezone.now()
        current_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_start = (current_start - timedelta(days=1)).replace(day=1)

        expenses = Transaction.objects.filter(
            user=request.user,
            type=Transaction.TransactionType.EXPENSE,
            date__gte=previous_start,
        )

        current_by_cat = defaultdict(Decimal)
        previous_by_cat = defaultdict(Decimal)

        for tx in expenses:
            cat_name = tx.category.name if tx.category else 'Sin categoría'
            cat_color = tx.category.color_hex if tx.category else '#c9ccc3'
            cat_id = tx.category.id if tx.category else None

            if tx.date >= current_start:
                current_by_cat[(cat_id, cat_name, cat_color)] += tx.amount
            else:
                previous_by_cat[(cat_id, cat_name, cat_color)] += tx.amount

        all_cats = set(current_by_cat.keys()) | set(previous_by_cat.keys())

        comparison_data = []
        for (cat_id, name, color) in all_cats:
            current = current_by_cat.get((cat_id, name, color), Decimal('0'))
            previous = previous_by_cat.get((cat_id, name, color), Decimal('0'))
            delta = current - previous
            pct_change = round((delta / previous * 100), 1) if previous > 0 else (100.0 if current > 0 else 0.0)

            comparison_data.append({
                'category_id': cat_id,
                'category_name': name,
                'category_color': color,
                'current_amount': float(current),
                'previous_amount': float(previous),
                'delta': float(delta),
                'pct_change': pct_change,
                'trend': 'up' if delta > 0 else ('down' if delta < 0 else 'stable'),
            })

        comparison_data.sort(key=lambda x: x['current_amount'], reverse=True)

        total_current = sum(d['current_amount'] for d in comparison_data)
        total_previous = sum(d['previous_amount'] for d in comparison_data)

        return Response({
            'period_current': current_start.strftime('%Y-%m'),
            'period_previous': previous_start.strftime('%Y-%m'),
            'total_current': total_current,
            'total_previous': total_previous,
            'total_delta': total_current - total_previous,
            'categories': comparison_data,
        })
