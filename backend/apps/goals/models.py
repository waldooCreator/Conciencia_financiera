"""
SavingsGoal models for Finanzas Personales.
Stores user savings goals with target amounts and deadlines.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class SavingsGoal(models.Model):
    """
    Represents a user's savings goal with target amount and progress tracking.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='savings_goals'
    )
    name = models.CharField(max_length=150)
    target_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    current_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'savings_goals'
        verbose_name = 'savings goal'
        verbose_name_plural = 'savings goals'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - ${self.current_amount}/${self.target_amount}'

    @property
    def progress_percentage(self):
        """Calculate the progress percentage towards the goal."""
        if self.target_amount > 0:
            return min(100.0, (float(self.current_amount) / float(self.target_amount)) * 100.0)
        return 0.0

    @property
    def remaining_amount(self):
        """Calculate the remaining amount to reach the goal."""
        diff = self.target_amount - self.current_amount
        if diff < 0:
            return diff - diff  # returns Decimal('0')
        return diff
