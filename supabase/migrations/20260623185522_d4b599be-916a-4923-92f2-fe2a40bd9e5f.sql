
-- 1) Remplacer les politiques "public_all_*" trop permissives
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['alerts','mesures','capteurs','chambres_froides','groupes_froids','batteries_solaires','panneaux_solaires'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS public_all_select ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS public_all_insert ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS public_all_update ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS public_all_delete ON public.%I', t);

    -- Lecture publique conservée (données opérationnelles d'affichage)
    EXECUTE format('CREATE POLICY "read_all" ON public.%I FOR SELECT USING (true)', t);
    -- Écritures réservées aux utilisateurs authentifiés
    EXECUTE format('CREATE POLICY "auth_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "auth_update" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "auth_delete" ON public.%I FOR DELETE TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- Restreindre les écritures sur alerts au propriétaire (user_id) — corrige PUBLIC_USER_DATA
DROP POLICY IF EXISTS "auth_insert" ON public.alerts;
DROP POLICY IF EXISTS "auth_update" ON public.alerts;
DROP POLICY IF EXISTS "auth_delete" ON public.alerts;
CREATE POLICY "alerts_owner_insert" ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "alerts_owner_update" ON public.alerts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "alerts_owner_delete" ON public.alerts FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- 2) user_roles : politiques INSERT/DELETE réservées aux admins
DROP POLICY IF EXISTS "Admins manage roles insert" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles delete" ON public.user_roles;
CREATE POLICY "Admins manage roles insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Fixer search_path sur update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4) Revoquer l'exécution des fonctions SECURITY DEFINER auprès des rôles exposés
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
