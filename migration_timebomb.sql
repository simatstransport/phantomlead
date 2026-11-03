-- 1. Add duration and expiry tracking to the database
ALTER TABLE public.payments ADD COLUMN duration_months INTEGER;
ALTER TABLE public.licenses ADD COLUMN duration_months INTEGER;
ALTER TABLE public.licenses ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Ensure all existing licenses are treated as "Lifetime" (no expiration)
UPDATE public.licenses SET duration_months = NULL, expires_at = NULL WHERE duration_months IS NULL;

-- 3. We will modify the Edge Functions via code to populate expires_at = NOW() + (duration_months * 30 days)
