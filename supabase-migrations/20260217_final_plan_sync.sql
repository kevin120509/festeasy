-- 1. Normalizar datos existentes para cumplir con la nueva restricción
UPDATE public.perfil_proveedor SET tipo_suscripcion_actual = 'festeasy' 
WHERE tipo_suscripcion_actual IS NULL OR tipo_suscripcion_actual != 'festeasy';

UPDATE public.historial_suscripciones SET plan = 'festeasy'
WHERE plan IS NULL OR plan != 'festeasy';

-- 2. Actualizar restricciones en perfil_proveedor (Solo FestEasy Plus)
ALTER TABLE public.perfil_proveedor 
DROP CONSTRAINT IF EXISTS perfil_proveedor_tipo_suscripcion_actual_check;

ALTER TABLE public.perfil_proveedor 
ADD CONSTRAINT perfil_proveedor_tipo_suscripcion_actual_check 
CHECK (tipo_suscripcion_actual = 'festeasy');

-- 3. Actualizar restricciones en historial_suscripciones
ALTER TABLE public.historial_suscripciones
DROP CONSTRAINT IF EXISTS historial_suscripciones_plan_check;

ALTER TABLE public.historial_suscripciones
ADD CONSTRAINT historial_suscripciones_plan_check
CHECK (plan = 'festeasy');

-- 4. Limpiar y sincronizar configuracion_planes
TRUNCATE public.configuracion_planes;

INSERT INTO public.configuracion_planes (id, nombre, precio, tipo, max_paquetes)
VALUES 
('festeasy', 'FestEasy Plus', 499, 'plan', 999),
('website', 'Sitio Web', 299, 'addon', 0),
('redes', 'Redes Sociales', 399, 'addon', 0),
('ia', 'Asistente IA', 599, 'addon', 0);
