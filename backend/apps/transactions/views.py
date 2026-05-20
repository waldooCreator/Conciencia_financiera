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


class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing transactions.
    Users can only access their own transactions.
    """
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Return only the current user's transactions."""
        queryset = Transaction.objects.filter(user=self.request.user)
        
        # Filter by type if provided
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(type=transaction_type)
        
        # Filter by wallet if provided
        wallet_id = self.request.query_params.get('wallet')
        if wallet_id:
            queryset = queryset.filter(wallet_id=wallet_id)
        
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        return queryset

    def perform_create(self, serializer):
        """Create transaction associated with the current user."""
        serializer.save(user=self.request.user)

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
