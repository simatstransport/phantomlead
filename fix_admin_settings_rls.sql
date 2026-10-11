ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can manage admin_settings" ON public.admin_settings;

CREATE POLICY "Anyone can read admin_settings" 
ON public.admin_settings 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admins can manage admin_settings" 
ON public.admin_settings 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Seed default settings if not existing
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('maintenance_mode', 'false'::jsonb, 'Toggle platform maintenance mode'),
  ('maintenance_end_time', '""'::jsonb, 'Scheduled end time for maintenance'),
  ('maintenance_message', '"Our engineering team is actively upgrading system components. All customer sessions and logins are temporarily locked. Please come back and log in at the scheduled completion time."'::jsonb, 'Notice message for maintenance mode')
ON CONFLICT (key) DO NOTHING;
