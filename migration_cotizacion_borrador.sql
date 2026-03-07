-- Migración para añadir el borrador de cotización en formato JSON
-- Ejecuta este script en la consola de Supabase SQL Editor

ALTER TABLE solicitudes
ADD COLUMN IF NOT EXISTS cotizacion_borrador JSONB;

-- Comentario para documentar la columna
COMMENT ON COLUMN solicitudes.cotizacion_borrador IS 'Almacena la estructura en JSON del paquete personalizado editado por el proveedor.';
