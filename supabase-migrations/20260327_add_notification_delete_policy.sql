-- =====================================================
-- Habilitar Eliminación de Notificaciones para Usuarios
-- =====================================================

-- 1. Política para permitir DELETE en tabla 'notificaciones'
-- Solo si el usuario logueado es el dueño de la notificación (usuario_id)
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notificaciones;

CREATE POLICY "Users can delete their own notifications"
ON public.notificaciones
FOR DELETE
USING (auth.uid() = usuario_id);

-- 2. Asegurarse de que el usuario también tenga permisos de SELECT (esto ya debería estar, pero se refuerza)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notificaciones;
CREATE POLICY "Users can view their own notifications"
ON public.notificaciones
FOR SELECT
USING (auth.uid() = usuario_id);
