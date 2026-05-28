# Plan de Despliegue: Finanzas Personales en Servidor Linux

## 1. Arquitectura de Producción

```
Internet → Nginx (reverse proxy) → Gunicorn (Django) → PostgreSQL
                │
                └── Sirve estáticos + PWA
```

## 2. Requisitos del Servidor

- **SO:** Ubuntu 22.04 LTS o superior
- **RAM:** 1 GB mínimo (2 GB recomendado)
- **Disco:** 20 GB
- **Puertos:** 80 (HTTP), 443 (HTTPS)
- **Dominio:** (opcional) ej: `finanzas.tudominio.com`

## 3. Paso a Paso

### 3.1 Conectar al servidor
```bash
ssh root@IP_DEL_SERVIDOR
```

### 3.2 Instalar dependencias
```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib git curl
```

### 3.3 Configurar PostgreSQL
```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE finanzas_db;
CREATE USER finanzas_user WITH PASSWORD 'contraseña_segura';
ALTER ROLE finanzas_user SET client_encoding TO 'utf8';
ALTER ROLE finanzas_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE finanzas_user SET timezone TO 'America/Bogota';
GRANT ALL PRIVILEGES ON DATABASE finanzas_db TO finanzas_user;
\q
```

### 3.4 Clonar el proyecto
```bash
mkdir -p /opt/finanzas
cd /opt/finanzas
git clone https://github.com/waldooCreator/Conciencia_financiera.git .
cd backend
```

### 3.5 Configurar entorno Python
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

### 3.6 Configurar variables de entorno
```bash
cat > .env << 'EOF'
DEBUG=False
SECRET_KEY=cambia-esto-por-una-clave-segura-larga-y-aleatoria
DATABASE_URL=postgres://finanzas_user:contraseña_segura@localhost:5432/finanzas_db
ALLOWED_HOSTS=IP_DEL_SERVIDOR,tu-dominio.com
CORS_ALLOWED_ORIGINS=http://IP_DEL_SERVIDOR,https://tu-dominio.com
EOF
```

### 3.7 Aplicar migraciones y estáticos
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3.8 Crear servicio systemd para Gunicorn
```bash
cat > /etc/systemd/system/finanzas.service << 'EOF'
[Unit]
Description=Finanzas Personales Django
After=network.target postgresql.service

[Service]
User=root
Group=root
WorkingDirectory=/opt/finanzas/backend
EnvironmentFile=/opt/finanzas/backend/.env
ExecStart=/opt/finanzas/backend/venv/bin/gunicorn config.wsgi:application \
    --bind 127.0.0.1:8000 \
    --workers 3 \
    --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable finanzas
systemctl start finanzas
```

### 3.9 Configurar Nginx
```bash
cat > /etc/nginx/sites-available/finanzas << 'EOF'
server {
    listen 80;
    server_name IP_DEL_SERVIDOR tu-dominio.com;

    client_max_body_size 10M;

    # API Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Estáticos
    location /static/ {
        alias /opt/finanzas/backend/staticfiles/;
    }

    # PWA (frontend)
    location / {
        root /opt/finanzas/frontend/dist;
        try_files $uri /index.html;
    }
}
EOF

ln -s /etc/nginx/sites-available/finanzas /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### 3.10 Construir el frontend (PWA)
```bash
cd /opt/finanzas/frontend
npm install
npx expo export --platform web
# La salida estará en /opt/finanzas/frontend/dist/
```

Actualizar `.env` del frontend antes de buildear:
```
EXPO_PUBLIC_API_URL=https://TU_DOMINIO_O_IP/api
```

### 3.11 HTTPS con Certbot (recomendado)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

## 4. Script de despliegue rápido

```bash
#!/bin/bash
# deploy.sh - Ejecutar en el servidor

cd /opt/finanzas

# Backend
cd backend
source venv/bin/activate
git pull origin main
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
systemctl restart finanzas

# Frontend
cd ../frontend
git pull origin main
npm install
npx expo export --platform web
systemctl restart nginx

echo "✅ Despliegue completado"
```

## 5. APK apuntando al servidor

En el `.env` del frontend local (para build APK):
```
EXPO_PUBLIC_API_URL=https://TU_DOMINIO_O_IP/api
```

Luego buildear APK:
```bash
eas build --platform android --profile preview
```

## 6. Costos estimados

| Proveedor | Plan | Precio/mes |
|---|---|---|
| **Railway** | Starter | $5 USD |
| **Render** | Individual | $0 (con límites) |
| **Hetzner** | VPS CX22 | €4 |
| **DigitalOcean** | Droplet 1GB | $6 USD |
| **AWS Lightsail** | 1GB | $5 USD |

## 7. Monitoreo

```bash
# Ver logs de Django
journalctl -u finanzas -f

# Ver logs de Nginx
tail -f /var/log/nginx/access.log

# Estado de servicios
systemctl status finanzas nginx postgresql
```
