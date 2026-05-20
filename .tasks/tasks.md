# Plan de Ejecución (Tasks): Finanzas Personales

## Fase 1: Infraestructura y Entorno (Backend)
- [x] 1.1 Inicializar repositorio y estructura base del proyecto.
  - **Fecha de completado:** 19/05/2026
  - **Implementación:**
    - Repositorio Git inicializado con remote apuntando a `https://github.com/waldooCreator/Conciencia_financiera.git`
    - Estructura de directorios creada:
      - `backend/` - Proyecto Django con estructura modular
        - `config/` - Configuración de Django (settings.py, urls.py, wsgi.py)
        - `apps/` - Aplicaciones Django: `users`, `wallets`, `transactions`, `categories`, `goals`
        - `manage.py` - Script de administración de Django
        - `requirements.txt` - Dependencias Python
        - `Dockerfile` - Configuración de contenedor para backend
      - `frontend/` - Proyecto Expo (React Native)
        - `src/` - Código fuente: `components`, `screens`, `services`, `utils`, `assets`
        - `package.json` - Dependencias Node.js
        - `app.json` - Configuración de Expo
        - `tailwind.config.js` - Configuración de Tailwind con tokens de diseño
      - `infrastructure/` - Archivos de infraestructura
      - `docs/` - Documentación del proyecto
    - Archivos de configuración creados:
      - `.gitignore` - Reglas de exclusión para Python, Django, Node, IDE, OS
      - `.env.example` - Variables de entorno de ejemplo
      - `docker-compose.yml` - Orquestación de servicios (PostgreSQL, Django, Redis)
      - `README.md` - Documentación principal del proyecto
    - Settings de Django configurados con:
      - DRF + SimpleJWT para autenticación
      - CORS habilitado para frontend
      - PostgreSQL como base de datos
      - Modelo de usuario personalizado (`AUTH_USER_MODEL = 'users.User'`)
      - Zona horaria `America/Bogota` y lenguaje `es-es`
- [x] 1.2 Configurar `docker-compose.yml` para levantar PostgreSQL y aislar el entorno (asegurar mapeo correcto de volúmenes y puertos, optimizado para entornos de desarrollo fluidos, incluyendo integración sin fallos de red en WSL 2).
  - **Fecha de completado:** 19/05/2026
  - **Implementación:**
    - `docker-compose.yml` optimizado para WSL 2 con:
      - Volúmenes nombrados para PostgreSQL, Redis y archivos estáticos
      - Healthchecks para todos los servicios (db, backend, redis)
      - Límites de recursos para PostgreSQL (512MB RAM)
      - Opción `restart: unless-stopped` para todos los servicios
      - Mapeo de puertos configurables mediante variables de entorno
      - Volumen `:cached` para el backend (mejora rendimiento en WSL 2)
      - Red personalizada `finanzas_network`
    - `backend/entrypoint.sh` creado con:
      - Espera activa hasta que PostgreSQL esté disponible
      - Ejecución automática de migraciones
      - Creación automática de superusuario en desarrollo
      - Recolección de estáticos en producción
    - `backend/Dockerfile` optimizado:
      - Imagen base `python:3.11-slim`
      - Instalación de dependencias del sistema necesarias
      - Soporte para modo desarrollo/producción
    - `backend/.dockerignore` para excluir archivos innecesarios del build
    - `infrastructure/db/init.sql` para inicialización de PostgreSQL:
      - Extensiones `uuid-ossp` y `pg_trgm`
    - `Makefile` con comandos útiles:
      - `make up`, `make down`, `make build`, `make migrate`
      - `make shell`, `make logs`, `make clean`, `make test`
    - `backend/apps/health/` con endpoint de health check (`/api/health/`)
    - `.env.development` con variables de entorno para desarrollo local
- [ ] 1.3 Inicializar proyecto Django y configurar conexión a la base de datos PostgreSQL dentro de Docker.
- [ ] 1.4 Instalar y configurar Django REST Framework (DRF) y JWT para autenticación.

## Fase 2: Modelado de Datos y API (Backend)
- [ ] 2.1 Crear modelo `User` personalizado (si es necesario) y modelos `Wallet`, `Category`, `Transaction` y `SavingsGoal` según el `design.md`.
- [ ] 2.2 Generar y aplicar migraciones en la base de datos.
- [ ] 2.3 Desarrollar serializers y ViewSets (CRUD) para las entidades financieras (asegurando que cada usuario solo acceda a sus propios datos).
- [ ] 2.4 Desarrollar lógica de cálculo de deuda para tarjetas de crédito (cuotas) en el endpoint de transacciones.

## Fase 3: Infraestructura y UI Core (Frontend PWA)
- [ ] 3.1 Inicializar proyecto Expo (React Native) con soporte explícito para PWA (Web).
- [ ] 3.2 Configurar Tailwind CSS / NativeWind mapeando estrictamente los Design Tokens del `design.md` (`noir`, `denim`, `bone`, `steel`, `concrete`).
- [ ] 3.3 Construir componentes atómicos base: `<PrimaryButton />` (con animación de escala) y `<FormInput />`.
- [ ] 3.4 Construir el componente `<TransactionCard />` aplicando los estilos de bordes y tipografía del sistema.

## Fase 4: Flujos de Usuario y Pantallas (Frontend)
- [ ] 4.1 Implementar pantalla de Login/Registro estándar conectada al backend (JWT).
- [ ] 4.2 Construir el flujo de Onboarding (OOBE) paso a paso ("estilo Apple" usando transiciones suaves y `FadeIn`).
- [ ] 4.3 Desarrollar el *Bottom Navigation Bar* y la pantalla principal de "Registrar Gasto" (Fricción Cero).
- [ ] 4.4 Construir la vista de Dashboard integrando los gráficos de KPIs (Progreso de ahorro, Gasto vs Mes Anterior, Proyección de Deuda).

## Fase 5: Sincronización y Casos Extremos
- [ ] 5.1 Implementar almacenamiento local (`AsyncStorage` o equivalente en web) para persistir temporalmente la creación de gastos cuando no hay conexión.
- [ ] 5.2 Desarrollar la lógica (Service Worker / Cola de reintentos) para sincronizar las transacciones locales con el backend al recuperar red.