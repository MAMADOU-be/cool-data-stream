
DROP POLICY IF EXISTS "Système met à jour panneaux" ON public.panneaux_solaires;
DROP POLICY IF EXISTS "Système met à jour batteries" ON public.batteries_solaires;
DROP POLICY IF EXISTS "Authentifiés insèrent mesures" ON public.mesures;

CREATE POLICY "Admin/Op MAJ panneaux" ON public.panneaux_solaires FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operateur'));
CREATE POLICY "Admin/Op MAJ batteries" ON public.batteries_solaires FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operateur'));
CREATE POLICY "Admin/Op insèrent mesures" ON public.mesures FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operateur') OR has_role(auth.uid(),'agriculteur') OR has_role(auth.uid(),'user'));
