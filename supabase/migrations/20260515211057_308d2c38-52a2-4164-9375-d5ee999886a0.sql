
-- Drop FK & nullable on alerts.user_id
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_user_id_fkey;
ALTER TABLE public.alerts ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing policies and add permissive ones for demo (no auth)
DO $$
DECLARE
  t text;
  p record;
  tables text[] := ARRAY['alerts','capteurs','chambres_froides','groupes_froids','mesures','panneaux_solaires','batteries_solaires'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "public_all_select" ON public.%I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "public_all_insert" ON public.%I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "public_all_update" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "public_all_delete" ON public.%I FOR DELETE USING (true)', t);
  END LOOP;
END$$;
