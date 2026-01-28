-- 🚨 REBUILD SCRIPT FOR RESENAS TABLE 🚨
-- Run this script in your Supabase SQL Editor to reset the structure.

-- 1. Drop existing table if it exists
DROP TABLE IF EXISTS public.resenas;

-- 2. Create the table with strict structure
CREATE TABLE public.resenas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id),
    cliente_id UUID NOT NULL REFERENCES auth.users(id),
    proveedor_id UUID NOT NULL REFERENCES auth.users(id),
    puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: One review per request
    CONSTRAINT unique_resena_por_solicitud UNIQUE (solicitud_id)
);

-- 3. Enable Row Level Security (RLS) - Recommended
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Optional but Good Practice)
-- Allow anyone to read reviews
CREATE POLICY "Public reviews are viewable by everyone" ON public.resenas
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON public.resenas
    FOR INSERT WITH CHECK (auth.uid() = cliente_id);

-- 5. ENABLE REALTIME FOR SOLICITUDES (Critical for the requirements)
-- This ensures the client receives the UPDATE event when status changes to 'finalizado'
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes;
