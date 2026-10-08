ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS license_key_encrypted TEXT;