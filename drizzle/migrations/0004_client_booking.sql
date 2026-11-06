ALTER TABLE public.appointments ADD COLUMN client_id uuid, ADD COLUMN service_id uuid REFERENCES public.salon_services(id) ON DELETE SET NULL, ADD COLUMN status text NOT NULL DEFAULT 'confirmed', ADD COLUMN price_snapshot text NOT NULL DEFAULT '';
CREATE TABLE public.salon_booking_hours (salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE, weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6), opens_min integer NOT NULL DEFAULT 480 CHECK (opens_min BETWEEN 0 AND 1439), closes_min integer NOT NULL DEFAULT 1200 CHECK (closes_min BETWEEN 1 AND 1440), enabled boolean NOT NULL DEFAULT false, PRIMARY KEY(salon_id,weekday), CHECK(opens_min < closes_min));
GRANT SELECT ON public.salon_booking_hours TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.salon_booking_hours TO authenticated;
GRANT ALL ON public.salon_booking_hours TO service_role;
ALTER TABLE public.salon_booking_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read booking hours" ON public.salon_booking_hours FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY "Owners manage booking hours" ON public.salon_booking_hours FOR ALL TO authenticated USING(public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK(public.owns_salon(salon_id) OR public.has_role(auth.uid(),'admin'));
CREATE INDEX appointments_booking_lookup ON public.appointments(salon_id, starts_at) WHERE status='confirmed';
CREATE OR REPLACE FUNCTION public.validate_appointment_booking() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.salon_id::text,0));
 IF NEW.duration_min < 15 OR NEW.duration_min > 720 THEN RAISE EXCEPTION 'Czas wizyty musi wynosić od 15 do 720 minut'; END IF;
 IF NEW.status NOT IN ('confirmed','cancelled') THEN RAISE EXCEPTION 'Nieprawidłowy status wizyty'; END IF;
 IF NEW.employee_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.salon_employees WHERE id=NEW.employee_id AND salon_id=NEW.salon_id) THEN RAISE EXCEPTION 'Stylistka nie należy do tego salonu'; END IF;
 IF NEW.status='confirmed' AND EXISTS(SELECT 1 FROM public.appointments a WHERE a.salon_id=NEW.salon_id AND a.id<>NEW.id AND a.status='confirmed' AND (a.employee_id IS NULL OR NEW.employee_id IS NULL OR a.employee_id=NEW.employee_id) AND a.starts_at < NEW.starts_at + make_interval(mins=>NEW.duration_min) AND a.starts_at + make_interval(mins=>a.duration_min) > NEW.starts_at) THEN RAISE EXCEPTION 'Ten termin jest już zajęty. Wybierz inny.'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_appointment_booking BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_booking();
CREATE OR REPLACE FUNCTION public.booking_salons() RETURNS TABLE(id uuid,name text,city text,image_url text,stylist text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT s.id,s.name,s.city,s.image_url,s.stylist FROM public.salons s JOIN public.profiles p ON p.id=s.owner_id WHERE p.status='approved' AND p.account_type='salon' ORDER BY s.name $$;
REVOKE ALL ON FUNCTION public.booking_salons() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.booking_salons() TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.booking_slots(p_salon uuid,p_service uuid,p_employee uuid,p_day date,p_exclude uuid DEFAULT NULL) RETURNS TABLE(starts_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT slot FROM public.salon_booking_hours h JOIN public.salon_services svc ON svc.salon_id=h.salon_id AND svc.id=p_service JOIN public.salon_employees e ON e.salon_id=h.salon_id AND e.id=p_employee JOIN public.salons s ON s.id=h.salon_id JOIN public.profiles p ON p.id=s.owner_id CROSS JOIN LATERAL generate_series((p_day::timestamp + make_interval(mins=>h.opens_min)) AT TIME ZONE 'Europe/Warsaw', (p_day::timestamp + make_interval(mins=>h.closes_min-svc.duration_min)) AT TIME ZONE 'Europe/Warsaw',interval '15 minutes') slot
 WHERE h.salon_id=p_salon AND h.weekday=extract(dow FROM p_day)::integer AND h.enabled AND svc.duration_min BETWEEN 15 AND 720 AND p.status='approved' AND p.account_type='salon' AND p_day >= (now() AT TIME ZONE 'Europe/Warsaw')::date AND p_day <= (now() AT TIME ZONE 'Europe/Warsaw')::date + 90 AND slot>now()
 AND NOT EXISTS(SELECT 1 FROM public.appointments a WHERE a.salon_id=p_salon AND a.status='confirmed' AND (a.employee_id=p_employee OR a.employee_id IS NULL) AND (p_exclude IS NULL OR a.id<>p_exclude OR a.client_id IS DISTINCT FROM auth.uid()) AND a.starts_at<slot+make_interval(mins=>svc.duration_min) AND a.starts_at+make_interval(mins=>a.duration_min)>slot) ORDER BY slot
$$;
REVOKE ALL ON FUNCTION public.booking_slots(uuid,uuid,uuid,date,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.booking_slots(uuid,uuid,uuid,date,uuid) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.book_appointment(p_salon uuid,p_service uuid,p_employee uuid,p_start timestamptz,p_name text,p_phone text,p_notes text DEFAULT '',p_appointment uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE svc public.salon_services; result_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT (EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND status='approved') OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Zaloguj się na zatwierdzone konto'; END IF;
 IF length(trim(p_name))<2 OR length(p_name)>100 OR length(regexp_replace(p_phone,'[^0-9]','','g')) NOT BETWEEN 9 AND 15 OR length(p_phone)>30 OR length(p_notes)>500 THEN RAISE EXCEPTION 'Podaj imię i poprawny numer telefonu'; END IF;
 IF p_appointment IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.appointments WHERE id=p_appointment AND client_id=auth.uid() AND status='confirmed' AND starts_at>now() AND salon_id=p_salon) THEN RAISE EXCEPTION 'Nie można zmienić tej wizyty'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_salon::text,0));
 SELECT * INTO svc FROM public.salon_services WHERE id=p_service AND salon_id=p_salon;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.booking_slots(p_salon,p_service,p_employee,(p_start AT TIME ZONE 'Europe/Warsaw')::date,p_appointment) b WHERE b.starts_at=p_start) THEN RAISE EXCEPTION 'Termin jest niedostępny. Wybierz inny.'; END IF;
 IF p_appointment IS NULL THEN
 INSERT INTO public.appointments(salon_id,employee_id,client_id,service_id,client_name,client_phone,service,starts_at,duration_min,notes,price_snapshot) VALUES(p_salon,p_employee,auth.uid(),svc.id,trim(p_name),trim(p_phone),svc.name,p_start,svc.duration_min,trim(p_notes),svc.price) RETURNING id INTO result_id;
 ELSE
 UPDATE public.appointments SET employee_id=p_employee,service_id=svc.id,service=svc.name,starts_at=p_start,duration_min=svc.duration_min,price_snapshot=svc.price,client_name=trim(p_name),client_phone=trim(p_phone) WHERE id=p_appointment AND client_id=auth.uid() AND status='confirmed' AND starts_at>now() RETURNING id INTO result_id;
 IF result_id IS NULL THEN RAISE EXCEPTION 'Nie można zmienić tej wizyty'; END IF;
 END IF;
 RETURN result_id;
END $$;
REVOKE ALL ON FUNCTION public.book_appointment(uuid,uuid,uuid,timestamptz,text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_appointment(uuid,uuid,uuid,timestamptz,text,text,text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.my_appointments() RETURNS TABLE(id uuid,salon_id uuid,salon_name text,city text,employee_id uuid,employee_name text,service_id uuid,service text,starts_at timestamptz,duration_min integer,price text,status text,client_name text,client_phone text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT a.id,a.salon_id,s.name,s.city,a.employee_id,e.name,a.service_id,a.service,a.starts_at,a.duration_min,a.price_snapshot,a.status,a.client_name,a.client_phone FROM public.appointments a JOIN public.salons s ON s.id=a.salon_id LEFT JOIN public.salon_employees e ON e.id=a.employee_id WHERE a.client_id=auth.uid() ORDER BY a.starts_at DESC $$;
REVOKE ALL ON FUNCTION public.my_appointments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_appointments() TO authenticated;
CREATE OR REPLACE FUNCTION public.cancel_my_appointment(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.appointments SET status='cancelled' WHERE id=p_id AND client_id=auth.uid() AND status='confirmed' AND starts_at>now(); IF NOT FOUND THEN RAISE EXCEPTION 'Nie można anulować tej wizyty'; END IF; END $$;
REVOKE ALL ON FUNCTION public.cancel_my_appointment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_my_appointment(uuid) TO authenticated;