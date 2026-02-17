-- Migration to add active addons support for providers
ALTER TABLE public.perfil_proveedor 
ADD COLUMN IF NOT EXISTS addons jsonb DEFAULT '[]'::jsonb;

-- Update existing records if any
UPDATE public.perfil_proveedor SET addons = '[]'::jsonb WHERE addons IS NULL;
