"""
Views for Transaction CRUD operations.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from .models import Transaction
from .serializers import TransactionSerializer
from apps.wallets.models import Wallet


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transactions."""
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Reverse wallet balance when deleting a transaction."""
        wallet = instance.wallet
        amount = instance.amount

        if instance.type == Transaction.TransactionType.INCOME:
            wallet.balance -= amount  # Reverse income
        elif instance.type == Transaction.TransactionType.EXPENSE:
            if wallet.type == Wallet.WalletType.CREDIT:
                wallet.balance -= amount  # Reverse credit card debt
            else:
                wallet.balance += amount  # Reverse cash/debit expense

        wallet.save()
        instance.delete()

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get transaction summary for the current month.
        Returns total income, total expenses, and balance.
        """
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        transactions = Transaction.objects.filter(
            user=request.user,
            date__gte=start_of_month
        )
        
        total_income = transactions.filter(type=Transaction.TransactionType.INCOME).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_expenses = transactions.filter(type=Transaction.TransactionType.EXPENSE).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'period': 'current_month',
            'total_income': total_income,
            'total_expenses': total_expenses,
            'balance': total_income - total_expenses,
            'transaction_count': transactions.count()
        })
