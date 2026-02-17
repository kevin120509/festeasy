-- Migration to align client profile with provider profile status
ALTER TABLE public.perfil_cliente 
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'active'::text 
CHECK (estado = ANY (ARRAY['active'::text, 'blocked'::text]));
