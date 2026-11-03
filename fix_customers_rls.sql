ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;

-- Give full access to the user themselves
CREATE POLICY "Users can insert own customer record" ON public.customers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own customer record" ON public.customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own customer record" ON public.customers FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Give full access to admins
CREATE POLICY "Admins can view all customers" ON public.customers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  )
);
CREATE POLICY "Admins can update all customers" ON public.customers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  )
);
CREATE POLICY "Admins can delete all customers" ON public.customers FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()
  )
);
