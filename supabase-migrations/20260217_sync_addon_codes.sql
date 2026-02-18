-- ==========================================
-- SYNC ADDON CODES & CONSOLIDATE
-- ==========================================

-- 1. Actualizar IDs en configuracion_planes para coincidir con los códigos de la feature
UPDATE public.configuracion_planes
SET id = 'WEB_BUILDER', nombre = 'Sitio Web'
WHERE id = 'website';

-- 2. Asegurar que los addons iniciales estén en la tabla maestra de addons
INSERT INTO public.addons (name, price, code)
VALUES 
('Sitio Web', 299, 'WEB_BUILDER'),
('Asistente IA', 599, 'IA_ASSISTANT'),
('Redes Sociales', 399, 'SOCIAL_SHARE')
ON CONFLICT (code) DO UPDATE SET price = EXCLUDED.price;

-- 3. Actualizar la columna 'addons' de perfil_proveedor para usar los nuevos códigos si es necesario
-- (Opcional, pero previene errores si hay datos viejos)
UPDATE public.perfil_proveedor
SET addons = jsonb_set(addons, '{}', (
  SELECT jsonb_agg(CASE WHEN elem = '"website"' THEN '"WEB_BUILDER"'::jsonb ELSE elem END)
  FROM jsonb_array_elements(addons) AS elem
))
WHERE addons ? 'website';
