ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS owner_id uuid;
CREATE INDEX IF NOT EXISTS salons_owner_idx ON public.salons(owner_id);

CREATE OR REPLACE FUNCTION public.owns_salon(_salon_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.salons s join public.profiles p on p.id = s.owner_id
    where s.id = _salon_id and s.owner_id = auth.uid() and p.status = 'approved')
$$;

CREATE POLICY "Owners update own salon" ON public.salons FOR UPDATE TO authenticated
  USING (public.owns_salon(id)) WITH CHECK (owner_id = auth.uid());

CREATE TABLE public.salon_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  url text NOT NULL,
  style_slug text,
  caption text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salon_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_photos TO authenticated;
GRANT ALL ON public.salon_photos TO service_role;
ALTER TABLE public.salon_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photos public read" ON public.salon_photos FOR SELECT USING (true);
CREATE POLICY "Owners manage photos" ON public.salon_photos FOR ALL TO authenticated
  USING (public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.salon_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Stylistka rzęs',
  phone text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#d4af37',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salon_employees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_employees TO authenticated;
GRANT ALL ON public.salon_employees TO service_role;
ALTER TABLE public.salon_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees public read" ON public.salon_employees FOR SELECT USING (true);
CREATE POLICY "Owners manage employees" ON public.salon_employees FOR ALL TO authenticated
  USING (public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.salon_employees(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 120,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage appointments" ON public.appointments FOR ALL TO authenticated
  USING (public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin'));

UPDATE public.salons s SET owner_id = p.id FROM public.profiles p
  WHERE s.owner_id IS NULL AND p.account_type = 'salon' AND p.company_name = s.name;

CREATE POLICY "Salon media public read" ON storage.objects FOR SELECT USING (bucket_id = 'salon-media');
CREATE POLICY "Salon owners upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'salon-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Salon owners delete media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'salon-media' AND (storage.foldername(name))[1] = auth.uid()::text);