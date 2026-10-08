ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS college_name TEXT,
  ADD COLUMN IF NOT EXISTS academic_year TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_unique
  ON public.customers(user_id);