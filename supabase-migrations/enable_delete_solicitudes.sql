-- =====================================================
-- Habilitar Eliminación de Solicitudes para Clientes
-- =====================================================

-- 1. Asegurarse de que RLS esté habilitado (ya debería estarlo, pero por seguridad)
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- 2. Política para permitir DELETE en tabla 'solicitudes'
-- Solo si el usuario logueado es el dueño de la solicitud (cliente_usuario_id)
DROP POLICY IF EXISTS "Clientes pueden eliminar sus solicitudes" ON solicitudes;

CREATE POLICY "Clientes pueden eliminar sus solicitudes"
ON solicitudes
FOR DELETE
USING (auth.uid() = cliente_usuario_id);

-- 3. Política para permitir DELETE en tabla 'cotizaciones'
-- Necesario si la base de datos no tiene ON DELETE CASCADE configurado.
-- Permite borrar cotizaciones si pertenecen a una solicitud del cliente logueado.
DROP POLICY IF EXISTS "Clientes pueden eliminar cotizaciones de sus solicitudes" ON cotizaciones;

CREATE POLICY "Clientes pueden eliminar cotizaciones de sus solicitudes"
ON cotizaciones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM solicitudes s
    WHERE s.id = cotizaciones.solicitud_id
    AND s.cliente_usuario_id = auth.uid()
  )
);

-- 4. Verificación (Opcional)
-- Esta política ya debería existir para SELECT, pero confirmamos que puedan ver lo que van a borrar.
DROP POLICY IF EXISTS "Clientes pueden ver sus propias solicitudes" ON solicitudes;
CREATE POLICY "Clientes pueden ver sus propias solicitudes"
ON solicitudes
FOR SELECT
USING (auth.uid() = cliente_usuario_id);
