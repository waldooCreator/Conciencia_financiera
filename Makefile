.PHONY: help up down build migrate shell logs clean test

# ==========================================
# Makefile - Finanzas Personales
# Comandos útiles para desarrollo con Docker
# ==========================================

help: ## Mostrar esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Levantar todos los servicios
	docker-compose up -d

up-build: ## Levantar todos los servicios con rebuild
	docker-compose up -d --build

down: ## Detener todos los servicios
	docker-compose down

build: ## Construir las imágenes
	docker-compose build

build-no-cache: ## Construir las imágenes sin caché
	docker-compose build --no-cache

migrate: ## Ejecutar migraciones de Django
	docker-compose exec backend python manage.py migrate

makemigrations: ## Crear nuevas migraciones
	docker-compose exec backend python manage.py makemigrations

shell: ## Abrir shell de Django
	docker-compose exec backend python manage.py shell

db-shell: ## Abrir shell de PostgreSQL
	docker-compose exec db psql -U finanzas_user -d finanzas_db

superuser: ## Crear superusuario
	docker-compose exec backend python manage.py createsuperuser

logs: ## Ver logs de todos los servicios
	docker-compose logs -f

logs-backend: ## Ver logs del backend
	docker-compose logs -f backend

logs-db: ## Ver logs de la base de datos
	docker-compose logs -f db

ps: ## Ver estado de los servicios
	docker-compose ps

clean: ## Detener servicios y eliminar volúmenes
	docker-compose down -v

clean-all: ## Detener servicios, eliminar volúmenes e imágenes
	docker-compose down -v --rmi all

test: ## Ejecutar tests del backend
	docker-compose exec backend python manage.py test

test-coverage: ## Ejecutar tests con cobertura
	docker-compose exec backend python manage.py test --coverage

collectstatic: ## Recopilar archivos estáticos
	docker-compose exec backend python manage.py collectstatic --noinput
