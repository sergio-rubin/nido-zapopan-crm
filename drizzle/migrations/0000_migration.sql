CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 10 AND 20),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  status text NOT NULL DEFAULT 'Nuevo' CHECK (status IN ('Nuevo','Contactado','Le interesa','Descartado')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 2000)
);

GRANT SELECT ON public.leads TO authenticated;
GRANT UPDATE (status, note) ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX leads_status_created_at_idx ON public.leads (status, created_at DESC);
CREATE INDEX leads_email_created_at_idx ON public.leads (email, created_at DESC);

CREATE OR REPLACE FUNCTION public.leads_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.leads_set_updated_at();