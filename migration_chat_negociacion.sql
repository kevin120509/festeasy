-- ==============================================================================
-- MIGRACIÓN PARA MÓDULO DE NEGOCIACIÓN Y CHAT
-- Ejecuta este script desde la consola SQL de Supabase (SQL Editor)
-- ==============================================================================

-- 1. Modificar la restricción (CHECK) de estados de la tabla solicitudes
-- Primero eliminamos la restricción actual de estado (usaremos IF EXISTS por si acaso)
ALTER TABLE public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_estado_check;

-- Luego añadimos la nueva restricción con los nuevos estados ('en_negociacion', 'esperando_confirmacion_cliente')
ALTER TABLE public.solicitudes ADD CONSTRAINT solicitudes_estado_check
CHECK (estado = ANY (ARRAY[
    'pendiente_aprobacion'::text, 
    'en_negociacion'::text,
    'esperando_confirmacion_cliente'::text,
    'rechazada'::text, 
    'esperando_anticipo'::text, 
    'reservado'::text, 
    'en_progreso'::text, 
    'entregado_pendiente_liq'::text, 
    'finalizado'::text, 
    'cancelada'::text, 
    'abandonada'::text
]));


-- 2. Añadir columnas útiles a las solicitudes para manejar la nueva lógica
ALTER TABLE public.solicitudes 
ADD COLUMN IF NOT EXISTS expiracion_negociacion timestamp with time zone;


-- 3. Crear la tabla de mensajes del chat
CREATE TABLE IF NOT EXISTS public.mensajes_solicitud (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    solicitud_id uuid NOT NULL,
    emisor_usuario_id uuid NOT NULL,
    mensaje text NOT NULL,
    leido boolean NOT NULL DEFAULT false,
    creado_en timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT mensajes_solicitud_pkey PRIMARY KEY (id),
    CONSTRAINT fk_mensajes_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON DELETE CASCADE,
    CONSTRAINT fk_mensajes_emisor FOREIGN KEY (emisor_usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE
);


-- 4. Habilitar Seguridad de Nivel de Fila (RLS) en la tabla
ALTER TABLE public.mensajes_solicitud ENABLE ROW LEVEL SECURITY;

-- Política 1: Solo cliente y proveedor involucrados en la solicitud pueden leer los mensajes del chat
CREATE POLICY "participantes_lectura_mensajes" 
ON public.mensajes_solicitud 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = mensajes_solicitud.solicitud_id
    AND (s.cliente_usuario_id = auth.uid() OR s.proveedor_usuario_id = auth.uid())
  )
);

-- Política 2: Solo cliente y proveedor involucrados pueden enviar mensajes, 
-- y el emisor debe ser el usuario autenticado que está escribiendo
CREATE POLICY "participantes_insertar_mensajes" 
ON public.mensajes_solicitud 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = mensajes_solicitud.solicitud_id
    AND (s.cliente_usuario_id = auth.uid() OR s.proveedor_usuario_id = auth.uid())
  )
  AND auth.uid() = emisor_usuario_id
);

-- Política 3: Opcionalmente permitir a clientes o proveedores marcar mensajes como leídos
CREATE POLICY "participantes_actualizar_mensajes" 
ON public.mensajes_solicitud 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = mensajes_solicitud.solicitud_id
    AND (s.cliente_usuario_id = auth.uid() OR s.proveedor_usuario_id = auth.uid())
  )
);


-- 5. Habilitar Realtime para el chat
-- NOTA: Supabase tiene una publication por defecto llamada 'supabase_realtime'.
-- Intentamos añadir nuestra nueva tabla a esta publicación para que el socket web pueda enviar alertas
BEGIN;
  DO
  $$
  BEGIN
      IF NOT EXISTS (
          SELECT
          FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime' AND tablename = 'mensajes_solicitud'
      ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_solicitud;
      END IF;
  EXCEPTION WHEN undefined_object THEN
      -- Si la publicación supabase_realtime no existe, la creamos
      CREATE PUBLICATION supabase_realtime FOR TABLE public.mensajes_solicitud;
  END;
  $$;
COMMIT;
