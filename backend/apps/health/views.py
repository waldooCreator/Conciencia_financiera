"""
Health check view para verificar el estado del backend.
"""
from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError


def health_check(request):
    """
    Verifica que el backend y la base de datos estén funcionando.
    """
    db_status = 'ok'
    try:
        connections['default'].cursor()
    except OperationalError:
        db_status = 'error'

    status_code = 200 if db_status == 'ok' else 503

    return JsonResponse({
        'status': 'healthy' if db_status == 'ok' else 'unhealthy',
        'database': db_status,
        'version': '1.0.0',
    }, status=status_code)
