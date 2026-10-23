REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM authenticated;
GRANT SELECT ON public.leads TO authenticated;
GRANT UPDATE (status, note) ON public.leads TO authenticated;
REVOKE EXECUTE ON FUNCTION public.leads_set_updated_at() FROM PUBLIC, anon, authenticated;