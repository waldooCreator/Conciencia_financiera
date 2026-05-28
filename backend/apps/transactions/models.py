"""
Transaction models for Finanzas Personales.
Stores income, expenses, and transfers with installment support.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class Transaction(models.Model):
    """
    Represents a financial transaction (income, expense, or transfer).
    Supports installment payments for credit card purchases.
    """
    class TransactionType(models.TextChoices):
        INCOME = 'income', 'Ingreso'
        EXPENSE = 'expense', 'Gasto'
        TRANSFER = 'transfer', 'Transferencia'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    wallet = models.ForeignKey(
        'wallets.Wallet',
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    destination_wallet = models.ForeignKey(
        'wallets.Wallet',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='incoming_transfers',
        help_text='Destination wallet for transfers'
    )
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    type = models.CharField(
        max_length=10,
        choices=TransactionType.choices
    )
    description = models.CharField(max_length=255, blank=True, default='')
    installments = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Number of installments for credit card purchases'
    )
    current_installment = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Current installment number'
    )
    date = models.DateTimeField()
    is_synced = models.BooleanField(
        default=True,
        help_text='Indicates if transaction has been synced from offline mode'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'transaction'
        verbose_name_plural = 'transactions'
        ordering = ['-date']

    def __str__(self):
        return f'{self.get_type_display()}: ${self.amount} - {self.wallet.name}'

    @property
    def installment_amount(self):
        """Calculate the amount per installment."""
        if self.installments > 1:
            return self.amount / self.installments
        return self.amount

    @property
    def remaining_installments(self):
        """Calculate remaining installments."""
        return max(0, self.installments - self.current_installment + 1)
