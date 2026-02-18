-- Migration to add social media support to provider public pages
ALTER TABLE public.provider_public_page
ADD COLUMN instagram_url text,
ADD COLUMN facebook_url text,
ADD COLUMN tiktok_url text,
ADD COLUMN twitter_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.provider_public_page.instagram_url IS 'URL de Instagram del proveedor';
COMMENT ON COLUMN public.provider_public_page.facebook_url IS 'URL de Facebook del proveedor';
COMMENT ON COLUMN public.provider_public_page.tiktok_url IS 'URL de TikTok del proveedor';
COMMENT ON COLUMN public.provider_public_page.twitter_url IS 'URL de Twitter del proveedor';
