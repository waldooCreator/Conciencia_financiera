#!/bin/bash

# ==========================================
# Entrypoint script para Django Backend
# Espera a que PostgreSQL esté disponible antes de iniciar
# ==========================================

set -e

echo "🚀 Iniciando Finanzas Personales Backend..."

# Esperar a que PostgreSQL esté disponible
echo "⏳ Esperando conexión a PostgreSQL..."
while ! python -c "import psycopg2; psycopg2.connect(
    host='${POSTGRES_HOST:-db}',
    port=${POSTGRES_PORT:-5432},
    dbname='${POSTGRES_DB:-finanzas_db}',
    user='${POSTGRES_USER:-finanzas_user}',
    password='${POSTGRES_PASSWORD:-finanzas_password}'
)" 2>/dev/null; do
    echo "   ⏸️  PostgreSQL no está listo, reintentando en 2 segundos..."
    sleep 2
done

echo "✅ PostgreSQL está disponible!"

# Aplicar migraciones pendientes
echo "📦 Aplicando migraciones..."
python manage.py migrate --noinput

# Recopilar archivos estáticos (solo en producción)
if [ "${DJANGO_DEBUG}" = "False" ]; then
    echo "📁 Recopilando archivos estáticos..."
    python manage.py collectstatic --noinput
fi

# Crear superusuario si no existe (solo en desarrollo)
if [ "${DJANGO_DEBUG}" = "True" ]; then
    echo "👤 Verificando superusuario de desarrollo..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@finanzas.local').exists():
    User.objects.create_superuser('admin@finanzas.local', 'admin123')
    print('✅ Superusuario de desarrollo creado: admin@finanzas.local / admin123')
else:
    print('ℹ️  Superusuario ya existe')
" 2>/dev/null || echo "⚠️  No se pudo crear el superusuario automático"
fi

echo "🎉 Backend listo para iniciar!"

# Ejecutar el comando principal
exec "$@"
