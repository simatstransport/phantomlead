CREATE OR REPLACE FUNCTION public.sync_auth_user_to_customer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_name TEXT;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  customer_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'Customer'
  );

  UPDATE public.customers
  SET user_id = NEW.id,
      full_name = customer_name,
      updated_at = NOW()
  WHERE email = NEW.email
    AND user_id IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.customers (user_id, full_name, email)
    VALUES (NEW.id, customer_name, NEW.email)
    ON CONFLICT (user_id) DO UPDATE
      SET email = EXCLUDED.email,
          updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.customers AS customer
SET user_id = auth_user.id,
    full_name = COALESCE(
      NULLIF(auth_user.raw_user_meta_data ->> 'full_name', ''),
      customer.full_name
    ),
    updated_at = NOW()
FROM auth.users AS auth_user
WHERE customer.email = auth_user.email
  AND customer.user_id IS NULL;

INSERT INTO public.customers (user_id, full_name, email)
SELECT auth_user.id,
       COALESCE(
         NULLIF(auth_user.raw_user_meta_data ->> 'full_name', ''),
         NULLIF(split_part(auth_user.email, '@', 1), ''),
         'Customer'
       ),
       auth_user.email
FROM auth.users AS auth_user
WHERE auth_user.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.customers AS customer
    WHERE customer.user_id = auth_user.id
  )
ON CONFLICT (user_id) DO NOTHING;

DROP TRIGGER IF EXISTS on_auth_user_created_sync_customer ON auth.users;

CREATE TRIGGER on_auth_user_created_sync_customer
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user_to_customer();
