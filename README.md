# 💰 Conciencia Financiera - Aplicación de Finanzas Personales

Aplicación orientada a la gestión y conciencia financiera personal. Permite registrar ingresos y gastos de manera rápida (fricción cero), gestionar múltiples medios de pago (incluyendo el cálculo complejo de tarjetas de crédito) y visualizar KPIs claros sobre hábitos de consumo y metas de ahorro.

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React Native (Expo, PWA responsiva offline-first) |
| **Backend** | Python + Django REST Framework |
| **Base de Datos** | PostgreSQL |
| **Infraestructura** | Docker Compose |
| **Autenticación** | JWT (JSON Web Tokens) |

## 📋 Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo frontend)
- Python 3.11+ (para desarrollo backend)
- Git

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/waldooCreator/Conciencia_financiera.git
cd Conciencia_financiera
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Levantar servicios con Docker

```bash
docker-compose up -d
```

### 4. Ejecutar migraciones del backend

```bash
docker-compose exec backend python manage.py migrate
```

### 5. Crear superusuario (opcional)

```bash
docker-compose exec backend python manage.py createsuperuser
```

## 📁 Estructura del Proyecto

```
Conciencia_financiera/
├── backend/                 # Django REST Framework
│   ├── config/             # Configuración de Django
│   ├── apps/               # Aplicaciones Django
│   └── manage.py
├── frontend/               # React Native (Expo)
│   └── src/
│       ├── components/     # Componentes reutilizables
│       ├── screens/        # Pantallas de la app
│       ├── services/       # Servicios de API
│       ├── utils/          # Utilidades
│       └── assets/         # Recursos estáticos
├── infrastructure/         # Archivos de infraestructura
├── docs/                   # Documentación
├── .specs/                 # Especificaciones del proyecto
├── .design/                # Diseño técnico y UI/UX
├── .tasks/                 # Plan de tareas
├── docker-compose.yml      # Orquestación de servicios
└── .env.example            # Variables de entorno de ejemplo
```

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| NOIR | `#030706` | Texto principal, fondos oscuros |
| DENIM | `#20394a` | Elementos secundarios, tarjetas |
| BONE | `#f9f5ed` | Fondo principal, texto en modo oscuro |
| STEEL | `#6196aa` | Acentos, botones secundarios |
| CONCRETE | `#c9ccc3` | Bordes, placeholders, elementos deshabilitados |

## 📖 Documentación

- [Especificaciones del Proyecto](.specs/specs.md)
- [Diseño Técnico](.design/design.md)
- [Plan de Tareas](.tasks/tasks.md)

## 🧪 Desarrollo

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```

### Frontend (Expo)

```bash
cd frontend
npm install
npx expo start
```

## 📝 Licencia

Este proyecto es de uso educativo y personal.
