
-- 1. Default role for new signups = agriculteur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agriculteur');

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Operateur can update groupes_froids (toggle on/off)
DROP POLICY IF EXISTS operateur_update ON public.groupes_froids;
CREATE POLICY operateur_update ON public.groupes_froids
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'));

-- 3. Operateur can insert/update/delete alerts
DROP POLICY IF EXISTS alerts_owner_insert ON public.alerts;
DROP POLICY IF EXISTS alerts_owner_update ON public.alerts;
DROP POLICY IF EXISTS alerts_owner_delete ON public.alerts;

CREATE POLICY alerts_operateur_insert ON public.alerts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY alerts_operateur_update ON public.alerts
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY alerts_admin_delete ON public.alerts
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Operateur can insert mesures (the simulation) ; updates/deletes admin-only
DROP POLICY IF EXISTS admin_insert ON public.mesures;
CREATE POLICY mesures_operateur_insert ON public.mesures
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'));

-- 5. Operateur can update batteries_solaires and panneaux_solaires (simulation writes)
DROP POLICY IF EXISTS operateur_update ON public.batteries_solaires;
CREATE POLICY operateur_update ON public.batteries_solaires
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS operateur_update ON public.panneaux_solaires;
CREATE POLICY operateur_update ON public.panneaux_solaires
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'operateur') OR public.has_role(auth.uid(), 'admin'));
