-- Create the notificaciones table
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  tipo text NOT NULL, -- 'solicitud', 'pago', 'recordatorio', 'review', 'cancelacion'
  titulo text NOT NULL,
  mensaje text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  data jsonb, -- Extra data like solicitud_id
  creado_en timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications" ON public.notificaciones
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own notifications" ON public.notificaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "System can insert notifications" ON public.notificaciones
  FOR INSERT WITH CHECK (true);
