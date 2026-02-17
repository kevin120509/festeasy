-- 1. ELIMINAR TODAS LAS RESTRICCIONES PROBLEMÁTICAS
-- Ejecutamos esto en un bloque anónimo para evitar errores si no existen
DO $$ 
BEGIN 
    -- Eliminar constraints de perfil_proveedor
    ALTER TABLE public.perfil_proveedor DROP CONSTRAINT IF EXISTS perfil_proveedor_tipo_suscripcion_actual_check;
    ALTER TABLE public.perfil_proveedor DROP CONSTRAINT IF EXISTS perfil_proveedor_tipo_suscripcion_actual_check1;
    
    -- Eliminar constraints de historial_suscripciones
    ALTER TABLE public.historial_suscripciones DROP CONSTRAINT IF EXISTS historial_suscripciones_plan_check;
END $$;

-- 2. NORMALIZAR COLUMNA Y DEFAULT
-- Cambiamos el default a 'festeasy' para que cualquier registro nuevo no falle
ALTER TABLE public.perfil_proveedor ALTER COLUMN tipo_suscripcion_actual SET DEFAULT 'festeasy';
UPDATE public.perfil_proveedor SET tipo_suscripcion_actual = 'festeasy';

-- 3. AÑADIR INDICADOR DE PAGO (Sugerencia del usuario)
-- Esto servirá como fuente de verdad simplificada: ¿pagó este mes? sí/no
ALTER TABLE public.perfil_proveedor ADD COLUMN IF NOT EXISTS suscripcion_activa boolean DEFAULT true;
UPDATE public.perfil_proveedor SET suscripcion_activa = true;

-- 4. ASEGURAR COLUMNA ADDONS
ALTER TABLE public.perfil_proveedor ADD COLUMN IF NOT EXISTS addons jsonb DEFAULT '[]'::jsonb;

-- 5. SINCRONIZAR TABLA DE CONFIGURACIÓN
TRUNCATE public.configuracion_planes;
INSERT INTO public.configuracion_planes (id, nombre, precio, tipo, max_paquetes)
VALUES 
('festeasy', 'FestEasy Plus', 499, 'plan', 999),
('website', 'Sitio Web', 299, 'addon', 0),
('redes', 'Redes Sociales', 399, 'addon', 0),
('ia', 'Asistente IA', 599, 'addon', 0);
