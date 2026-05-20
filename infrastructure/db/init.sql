-- ==========================================
-- Script de inicialización de PostgreSQL
-- Se ejecuta automáticamente en el primer inicio del contenedor
-- ==========================================

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Base de datos inicializada correctamente para Finanzas Personales';
END $$;
