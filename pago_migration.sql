-- Script de migración corregido para la tabla de pagos
-- IMPORTANTE: Borra TODO el contenido actual del SQL Editor de Supabase antes de pegar esto.

ALTER TABLE public.pagos 
DROP CONSTRAINT IF EXISTS pagos_metodo_pago_check;

ALTER TABLE public.pagos
ADD CONSTRAINT pagos_metodo_pago_check 
CHECK (metodo_pago = ANY (ARRAY['transferencia'::text, 'efectivo'::text, 'deposito_oxxo'::text, 'paypal'::text, 'stripe'::text]));
