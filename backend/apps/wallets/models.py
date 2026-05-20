"""
Wallet models for Finanzas Personales.
Stores payment methods: cash, debit accounts, credit cards.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class Wallet(models.Model):
    """
    Represents a payment method (cash, debit account, or credit card).
    """
    class WalletType(models.TextChoices):
        CASH = 'cash', 'Efectivo'
        DEBIT = 'debit', 'Cuenta Bancaria'
        CREDIT = 'credit', 'Tarjeta de Crédito'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallets'
    )
    name = models.CharField(max_length=100)
    type = models.CharField(
        max_length=10,
        choices=WalletType.choices,
        default=WalletType.CASH
    )
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    credit_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    billing_cycle_date = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Day of the month for billing cycle (1-28)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wallets'
        verbose_name = 'wallet'
        verbose_name_plural = 'wallets'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.get_type_display()})'

    @property
    def available_credit(self):
        """Calculate available credit for credit cards."""
        if self.type == self.WalletType.CREDIT and self.credit_limit:
            return self.credit_limit - self.balance
        return None
