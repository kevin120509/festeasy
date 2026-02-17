-- ==========================================
-- WEB BUILDER MVP - ESTRUCTURA DE DATOS
-- ==========================================

-- 1. Tabla Maestra de Addons
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Junction table para Addons por Proveedor
CREATE TABLE IF NOT EXISTS public.provider_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_code text NOT NULL REFERENCES public.addons(code) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_provider_addon UNIQUE(provider_id, addon_code)
);

-- 3. Tabla para el contenido de la Página Pública
CREATE TABLE IF NOT EXISTS public.provider_public_page (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  slogan text,
  description text,
  hero_image text,
  hero_alignment text DEFAULT 'center' CHECK (hero_alignment IN ('left', 'center', 'right')),
  contact_phone text,
  contact_email text,
  contact_whatsapp text,
  gallery jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS (Seguridad)
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_public_page ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para las páginas
CREATE POLICY "Public Read for Provider Pages" ON public.provider_public_page
FOR SELECT USING (is_active = true);

-- Políticas de edición para el proveedor
CREATE POLICY "Providers can manage their own addons" ON public.provider_addons
FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "Providers can manage their own page" ON public.provider_public_page
FOR ALL USING (auth.uid() = provider_id);

-- SEED INITIAL DATA
INSERT INTO public.addons (name, price, code)
VALUES ('Web Builder', 300, 'WEB_BUILDER')
ON CONFLICT (code) DO UPDATE SET price = EXCLUDED.price;
