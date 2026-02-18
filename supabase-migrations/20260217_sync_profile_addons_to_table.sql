-- Migration to sync addons from perfil_proveedor.addons (JSONB) to provider_addons table
-- This ensures all providers with addons in their profile have corresponding records in provider_addons

-- Step 1: Insert missing addon records for providers who have addons in their profile
-- but don't have corresponding records in provider_addons table
INSERT INTO public.provider_addons (provider_id, addon_code, status, created_at)
SELECT 
    pp.usuario_id as provider_id,
    addon_value::text as addon_code,
    'active' as status,
    NOW() as created_at
FROM 
    public.perfil_proveedor pp,
    jsonb_array_elements_text(pp.addons) as addon_value
WHERE 
    pp.addons IS NOT NULL 
    AND jsonb_array_length(pp.addons) > 0
    AND NOT EXISTS (
        SELECT 1 
        FROM public.provider_addons pa 
        WHERE pa.provider_id = pp.usuario_id 
        AND pa.addon_code = addon_value::text
    );

-- Step 2: Normalize addon codes (convert old codes to new standard)
-- website -> WEB_BUILDER
UPDATE public.provider_addons
SET addon_code = 'WEB_BUILDER'
WHERE addon_code = 'website';

-- ia -> IA_ASSISTANT
UPDATE public.provider_addons
SET addon_code = 'IA_ASSISTANT'
WHERE addon_code = 'ia';

-- redes -> SOCIAL_SHARE
UPDATE public.provider_addons
SET addon_code = 'SOCIAL_SHARE'
WHERE addon_code = 'redes';

-- Step 3: Also update the JSONB column in perfil_proveedor to use normalized codes
UPDATE public.perfil_proveedor
SET addons = (
    SELECT jsonb_agg(
        CASE 
            WHEN elem::text = '"website"' THEN '"WEB_BUILDER"'
            WHEN elem::text = '"ia"' THEN '"IA_ASSISTANT"'
            WHEN elem::text = '"redes"' THEN '"SOCIAL_SHARE"'
            ELSE elem
        END
    )
    FROM jsonb_array_elements(addons) elem
)
WHERE addons IS NOT NULL 
AND jsonb_array_length(addons) > 0
AND (
    addons::text LIKE '%"website"%' OR 
    addons::text LIKE '%"ia"%' OR 
    addons::text LIKE '%"redes"%'
);

-- Verification query (optional - comment out if not needed)
-- SELECT 
--     pp.nombre_negocio,
--     pp.usuario_id,
--     pp.addons as profile_addons,
--     array_agg(pa.addon_code) as table_addons
-- FROM perfil_proveedor pp
-- LEFT JOIN provider_addons pa ON pa.provider_id = pp.usuario_id AND pa.status = 'active'
-- WHERE pp.addons IS NOT NULL AND jsonb_array_length(pp.addons) > 0
-- GROUP BY pp.usuario_id, pp.nombre_negocio, pp.addons;
