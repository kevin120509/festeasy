-- =====================================================
-- Políticas RLS para items_paquete
-- =====================================================
-- Permitir a los proveedores gestionar los items de sus propios paquetes
-- Fecha: 2026-02-18
-- =====================================================

-- Habilitar RLS en la tabla items_paquete si no está habilitado
ALTER TABLE items_paquete ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Proveedores pueden ver sus items" ON items_paquete;
DROP POLICY IF EXISTS "Proveedores pueden insertar items" ON items_paquete;
DROP POLICY IF EXISTS "Proveedores pueden actualizar sus items" ON items_paquete;
DROP POLICY IF EXISTS "Proveedores pueden eliminar sus items" ON items_paquete;
DROP POLICY IF EXISTS "Todos pueden ver items de paquetes publicados" ON items_paquete;

-- Política: Proveedores pueden ver los items de sus propios paquetes
CREATE POLICY "Proveedores pueden ver sus items" ON items_paquete
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM paquetes_proveedor 
            WHERE paquetes_proveedor.id = items_paquete.paquete_id 
            AND paquetes_proveedor.proveedor_usuario_id = auth.uid()
        )
    );

-- Política: Proveedores pueden insertar items en sus propios paquetes
CREATE POLICY "Proveedores pueden insertar items" ON items_paquete
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM paquetes_proveedor 
            WHERE paquetes_proveedor.id = items_paquete.paquete_id 
            AND paquetes_proveedor.proveedor_usuario_id = auth.uid()
        )
    );

-- Política: Proveedores pueden actualizar items de sus propios paquetes
CREATE POLICY "Proveedores pueden actualizar sus items" ON items_paquete
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM paquetes_proveedor 
            WHERE paquetes_proveedor.id = items_paquete.paquete_id 
            AND paquetes_proveedor.proveedor_usuario_id = auth.uid()
        )
    );

-- Política: Proveedores pueden eliminar items de sus propios paquetes
CREATE POLICY "Proveedores pueden eliminar sus items" ON items_paquete
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM paquetes_proveedor 
            WHERE paquetes_proveedor.id = items_paquete.paquete_id 
            AND paquetes_proveedor.proveedor_usuario_id = auth.uid()
        )
    );

-- Política: Todos pueden ver items de paquetes publicados (para clientes)
CREATE POLICY "Todos pueden ver items de paquetes publicados" ON items_paquete
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM paquetes_proveedor 
            WHERE paquetes_proveedor.id = items_paquete.paquete_id 
            AND paquetes_proveedor.estado = 'publicado'
        )
    );

-- Comentarios para documentación
COMMENT ON POLICY "Proveedores pueden ver sus items" ON items_paquete IS 
    'Permite a los proveedores ver los items de sus propios paquetes';

COMMENT ON POLICY "Proveedores pueden insertar items" ON items_paquete IS 
    'Permite a los proveedores agregar items a sus propios paquetes';

COMMENT ON POLICY "Proveedores pueden actualizar sus items" ON items_paquete IS 
    'Permite a los proveedores actualizar items de sus propios paquetes';

COMMENT ON POLICY "Proveedores pueden eliminar sus items" ON items_paquete IS 
    'Permite a los proveedores eliminar items de sus propios paquetes';

COMMENT ON POLICY "Todos pueden ver items de paquetes publicados" ON items_paquete IS 
    'Permite a cualquier usuario ver items de paquetes que están publicados';
