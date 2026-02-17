-- ==========================================
-- SCRIPT DE LIMPIEZA ATÓMICA Y SIMPLIFICACIÓN
-- ==========================================

-- 1. ELIMINAR DINÁMICAMENTE TODAS LAS RESTRICCIONES DE TIPO_SUSCRIPCION
-- Esto busca cualquier CHECK constraint en la columna y la borra, sea cual sea su nombre.
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.perfil_proveedor'::regclass 
        AND contype = 'c' 
        AND array_to_string(conkey, ',') IN (
            SELECT attnum::text 
            FROM pg_attribute 
            WHERE attrelid = 'public.perfil_proveedor'::regclass 
            AND attname = 'tipo_suscripcion_actual'
        )
    ) LOOP 
        EXECUTE 'ALTER TABLE public.perfil_proveedor DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 2. ELIMINAR RESTRICCIONES EN HISTORIAL POR SI ACASO
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.historial_suscripciones'::regclass 
        AND contype = 'c' 
        AND array_to_string(conkey, ',') IN (
            SELECT attnum::text 
            FROM pg_attribute 
            WHERE attrelid = 'public.historial_suscripciones'::regclass 
            AND attname = 'plan'
        )
    ) LOOP 
        EXECUTE 'ALTER TABLE public.historial_suscripciones DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 3. NORMALIZAR COLUMNA Y DEFAULT
-- Primero quitamos el default anterior
ALTER TABLE public.perfil_proveedor ALTER COLUMN tipo_suscripcion_actual DROP DEFAULT;
-- Actualizamos todos a 'festeasy'
UPDATE public.perfil_proveedor SET tipo_suscripcion_actual = 'festeasy';
-- Ponemos el nuevo default
ALTER TABLE public.perfil_proveedor ALTER COLUMN tipo_suscripcion_actual SET DEFAULT 'festeasy';

-- 4. AÑADIR INDICADOR DE PAGO (Sugerencia del usuario)
ALTER TABLE public.perfil_proveedor ADD COLUMN IF NOT EXISTS suscripcion_activa boolean DEFAULT true;
UPDATE public.perfil_proveedor SET suscripcion_activa = true;

-- 5. ASEGURAR COLUMNA ADDONS
ALTER TABLE public.perfil_proveedor ADD COLUMN IF NOT EXISTS addons jsonb DEFAULT '[]'::jsonb;

-- 6. SINCRONIZAR TABLA DE CONFIGURACIÓN
TRUNCATE public.configuracion_planes;
INSERT INTO public.configuracion_planes (id, nombre, precio, tipo, max_paquetes)
VALUES 
('festeasy', 'FestEasy Plus', 499, 'plan', 999),
('website', 'Sitio Web', 299, 'addon', 0),
('redes', 'Redes Sociales', 399, 'addon', 0),
('ia', 'Asistente IA', 599, 'addon', 0);
