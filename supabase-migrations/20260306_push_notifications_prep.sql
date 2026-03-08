-- 1. Preparar perfiles para OneSignal
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS onesignal_id TEXT;

-- Comentario para el equipo: onesignal_id guardará el subscriptionId del dispositivo

-- 2. Vista optimizada para el Chat de Negociación
-- Evita que Angular tenga que hacer múltiples peticiones para saber quién habla
CREATE OR REPLACE VIEW public.view_chat_mensajes AS
SELECT 
    m.id,
    m.solicitud_id,
    m.remitente_id,
    m.mensaje,
    m.creado_en,
    p.nombre as nombre_remitente,
    p.foto_url as foto_remitente,
    p.rol as rol_remitente
FROM public.mensajes_chat m
JOIN public.perfiles p ON m.remitente_id = p.id;

-- 3. Habilitar Realtime solo para lo que pertenece al usuario
-- Nota: Esto asume que tienes una columna de destinatario_id o similar en notificaciones
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios solo ven sus propias notificaciones" 
ON public.notificaciones 
FOR SELECT 
USING (auth.uid() = usuario_id);
