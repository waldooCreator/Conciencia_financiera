# ==========================================
# Dockerfile - Django Backend
# Optimizado para desarrollo en WSL 2
# ==========================================
FROM python:3.11-slim

# Argumentos de build
ARG DEV_MODE=false
ENV DEV_MODE=${DEV_MODE}

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove \
    && apt-get clean

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar el proyecto
COPY . .

# Corregir line endings (Windows→Linux) + hacer ejecutable
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Puerto de exposición
EXPOSE 8000

# Comando por defecto (sobrescrito en docker-compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
