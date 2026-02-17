-- Versión simplificada de la tabla de precios
CREATE TABLE IF NOT EXISTS public.configuracion_planes (
    id text PRIMARY KEY,
    nombre text NOT NULL,
    precio numeric NOT NULL DEFAULT 0,
    tipo text NOT NULL, -- 'plan' o 'addon'
    max_paquetes integer DEFAULT 0
);

-- Deshabilitar RLS para que la app pueda leer la tabla de configuración
ALTER TABLE public.configuracion_planes DISABLE ROW LEVEL SECURITY;

-- Datos indispensables
INSERT INTO public.configuracion_planes (id, nombre, precio, tipo, max_paquetes)
VALUES 
('libre', 'Plan Libre', 0, 'plan', 2),
('festeasy', 'Plan Plus', 499, 'plan', 999),
('website', 'Sitio Web', 299, 'addon', 0),
('redes', 'Redes Sociales', 399, 'addon', 0),
('ia', 'Asistente IA', 599, 'addon', 0)
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    precio = EXCLUDED.precio,
    tipo = EXCLUDED.tipo,
    max_paquetes = EXCLUDED.max_paquetes;
