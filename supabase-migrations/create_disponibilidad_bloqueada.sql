-- =====================================================
-- Tabla: disponibilidad_bloqueada
-- Descripción: Almacena las fechas bloqueadas manualmente por los proveedores
-- Autor: FestEasy Development Team
-- Fecha: 2026-01-19
-- =====================================================

-- Crear la tabla principal
CREATE TABLE IF NOT EXISTS disponibilidad_bloqueada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha_bloqueada DATE NOT NULL,
  motivo TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para evitar duplicados
  CONSTRAINT unique_provider_date UNIQUE(proveedor_usuario_id, fecha_bloqueada)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_disponibilidad_bloqueada_proveedor 
  ON disponibilidad_bloqueada(proveedor_usuario_id);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_bloqueada_fecha 
  ON disponibilidad_bloqueada(fecha_bloqueada);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_disponibilidad_bloqueada_proveedor_fecha 
  ON disponibilidad_bloqueada(proveedor_usuario_id, fecha_bloqueada);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE disponibilidad_bloqueada ENABLE ROW LEVEL SECURITY;

-- Política: Los proveedores solo pueden ver y gestionar sus propias fechas bloqueadas
CREATE POLICY "Proveedores pueden gestionar sus fechas bloqueadas"
  ON disponibilidad_bloqueada
  FOR ALL
  USING (auth.uid() = proveedor_usuario_id)
  WITH CHECK (auth.uid() = proveedor_usuario_id);

-- Política adicional: Permitir SELECT a admins (opcional)
-- Descomentar si necesitas que los administradores vean todos los bloqueos
-- CREATE POLICY "Admins pueden ver todas las fechas bloqueadas"
--   ON disponibilidad_bloqueada
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM auth.users 
--       WHERE id = auth.uid() 
--       AND raw_user_meta_data->>'rol' = 'admin'
--     )
--   );

-- =====================================================
-- Comentarios de documentación
-- =====================================================

COMMENT ON TABLE disponibilidad_bloqueada IS 'Almacena las fechas que los proveedores han bloqueado manualmente en su calendario';
COMMENT ON COLUMN disponibilidad_bloqueada.id IS 'Identificador único del bloqueo';
COMMENT ON COLUMN disponibilidad_bloqueada.proveedor_usuario_id IS 'ID del proveedor que bloqueó la fecha';
COMMENT ON COLUMN disponibilidad_bloqueada.fecha_bloqueada IS 'Fecha bloqueada (sin hora)';
COMMENT ON COLUMN disponibilidad_bloqueada.motivo IS 'Motivo opcional del bloqueo';
COMMENT ON COLUMN disponibilidad_bloqueada.creado_en IS 'Timestamp de creación del bloqueo';
