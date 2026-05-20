"""
Category models for Finanzas Personales.
Stores transaction categories with custom colors.
"""
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator


class Category(models.Model):
    """
    Represents a transaction category (e.g., Food, Transport, Savings).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categories'
    )
    name = models.CharField(max_length=100)
    color_hex = models.CharField(
        max_length=7,
        default='#6196aa',
        validators=[
            RegexValidator(
                regex='^#[0-9A-Fa-f]{6}$',
                message='Color must be in hex format (e.g., #6196aa)'
            )
        ]
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        verbose_name = 'category'
        verbose_name_plural = 'categories'
        ordering = ['name']
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name
