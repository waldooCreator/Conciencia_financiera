"""
Views for SavingsGoal CRUD operations.
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from .models import SavingsGoal
from .serializers import SavingsGoalSerializer


class SavingsGoalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing savings goals.
    Users can only access their own goals.
    """
    serializer_class = SavingsGoalSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        """Return only the current user's savings goals."""
        return SavingsGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create savings goal associated with the current user."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_funds(self, request, pk=None):
        """
        Add funds to a savings goal.
        Expects: {"amount": 100.00}
        """
        goal = self.get_object()
        amount = Decimal(request.data.get('amount', 0))
        
        if amount <= 0:
            return Response(
                {'error': 'Amount must be positive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        goal.current_amount += amount
        goal.save()
        
        serializer = self.get_serializer(goal)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def withdraw_funds(self, request, pk=None):
        """
        Withdraw funds from a savings goal.
        Expects: {"amount": 50.00}
        """
        goal = self.get_object()
        amount = Decimal(request.data.get('amount', 0))
        
        if amount <= 0:
            return Response(
                {'error': 'Amount must be positive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount > goal.current_amount:
            return Response(
                {'error': 'Insufficient funds in goal'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        goal.current_amount -= amount
        goal.save()
        
        serializer = self.get_serializer(goal)
        return Response(serializer.data)
