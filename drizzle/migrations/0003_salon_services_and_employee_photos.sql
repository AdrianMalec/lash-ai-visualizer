CREATE TABLE public.salon_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '',
  duration_min integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salon_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_services TO authenticated;
GRANT ALL ON public.salon_services TO service_role;
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services public read" ON public.salon_services FOR SELECT USING (true);
CREATE POLICY "Owners manage services" ON public.salon_services FOR ALL TO authenticated
  USING (owns_salon(salon_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_salon(salon_id) OR has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.salon_employees ADD COLUMN avatar_url text;
ALTER TABLE public.salon_photos ADD COLUMN custom_style text NOT NULL DEFAULT '';