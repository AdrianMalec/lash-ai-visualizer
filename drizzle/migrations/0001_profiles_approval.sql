CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  account_type text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'pending',
  company_name text,
  nip text,
  city text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read profile" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id,email,account_type,company_name,nip,city,address)
  VALUES (NEW.id, NEW.email,
    CASE WHEN NEW.raw_user_meta_data->>'account_type'='salon' THEN 'salon' ELSE 'user' END,
    left(NEW.raw_user_meta_data->>'company_name',200),
    left(regexp_replace(coalesce(NEW.raw_user_meta_data->>'nip',''),'[^0-9]','','g'),10),
    left(NEW.raw_user_meta_data->>'city',100),
    left(NEW.raw_user_meta_data->>'address',200))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles(id,email,status)
SELECT id,email,'approved' FROM auth.users ON CONFLICT DO NOTHING;