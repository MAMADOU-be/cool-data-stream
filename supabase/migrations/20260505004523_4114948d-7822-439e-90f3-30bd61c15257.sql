
-- État des alertes
DO $$ BEGIN
  CREATE TYPE public.alert_state AS ENUM ('creee', 'active', 'lue', 'resolue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.capteur_type AS ENUM ('temperature', 'humidite', 'porte');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Chambres froides
CREATE TABLE public.chambres_froides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  localisation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chambres_froides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authentifiés voient les chambres" ON public.chambres_froides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gèrent les chambres" ON public.chambres_froides FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Capteurs
CREATE TABLE public.capteurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chambre_id uuid NOT NULL REFERENCES public.chambres_froides(id) ON DELETE CASCADE,
  type public.capteur_type NOT NULL,
  emplacement text NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.capteurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authentifiés voient capteurs" ON public.capteurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gèrent capteurs" ON public.capteurs FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Mesures
CREATE TABLE public.mesures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capteur_id uuid NOT NULL REFERENCES public.capteurs(id) ON DELETE CASCADE,
  chambre_id uuid NOT NULL REFERENCES public.chambres_froides(id) ON DELETE CASCADE,
  type public.capteur_type NOT NULL,
  valeur double precision NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mesures_chambre_ts ON public.mesures(chambre_id, timestamp DESC);
CREATE INDEX idx_mesures_capteur_ts ON public.mesures(capteur_id, timestamp DESC);
ALTER TABLE public.mesures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authentifiés voient mesures" ON public.mesures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authentifiés insèrent mesures" ON public.mesures FOR INSERT TO authenticated WITH CHECK (true);

-- Groupes froids
CREATE TABLE public.groupes_froids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chambre_id uuid NOT NULL REFERENCES public.chambres_froides(id) ON DELETE CASCADE,
  reference text NOT NULL DEFAULT 'XJQ10MBGR404',
  nom text NOT NULL,
  etat boolean NOT NULL DEFAULT true,
  consommation_w double precision NOT NULL DEFAULT 0,
  last_update timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.groupes_froids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authentifiés voient groupes" ON public.groupes_froids FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Opérateur gèrent groupes" ON public.groupes_froids FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operateur'));
CREATE POLICY "Admin gère groupes (insert/delete)" ON public.groupes_froids FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin supprime groupes" ON public.groupes_froids FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- Panneaux solaires
CREATE TABLE public.panneaux_solaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chambre_id uuid NOT NULL REFERENCES public.chambres_froides(id) ON DELETE CASCADE,
  nom text NOT NULL,
  production_w double precision NOT NULL DEFAULT 0,
  last_update timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.panneaux_solaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authentifiés voient panneaux" ON public.panneaux_solaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gère panneaux" ON public.panneaux_solaires FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Système met à jour panneaux" ON public.panneaux_solaires FOR UPDATE TO authenticated USING (true);

-- Batteries solaires
CREATE TABLE public.batteries_solaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chambre_id uuid NOT NULL REFERENCES public.chambres_froides(id) ON DELETE CASCADE,
  pourcentage double precision NOT NULL DEFAULT 100,
  voltage double precision NOT NULL DEFAULT 48,
  capacite_kwh double precision NOT NULL DEFAULT 20,
  last_update timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.batteries_solaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authentifiés voient batteries" ON public.batteries_solaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin gère batteries" ON public.batteries_solaires FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Système met à jour batteries" ON public.batteries_solaires FOR UPDATE TO authenticated USING (true);

-- Refonte alertes : ajouter colonnes
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS chambre_id uuid REFERENCES public.chambres_froides(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS valeur double precision,
  ADD COLUMN IF NOT EXISTS seuil double precision,
  ADD COLUMN IF NOT EXISTS etat public.alert_state NOT NULL DEFAULT 'creee';

-- Politique : opérateur/admin peuvent voir+update toutes les alertes
DROP POLICY IF EXISTS "Users see own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users update own alerts" ON public.alerts;
CREATE POLICY "Voir alertes (admin/op/owner)" ON public.alerts FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operateur'));
CREATE POLICY "Maj alertes (admin/op/owner)" ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operateur'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mesures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groupes_froids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batteries_solaires;
ALTER PUBLICATION supabase_realtime ADD TABLE public.panneaux_solaires;

-- Trigger updated_at
CREATE TRIGGER trg_chambres_updated BEFORE UPDATE ON public.chambres_froides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Données initiales : chambre Niayes
DO $$
DECLARE
  v_chambre uuid;
BEGIN
  INSERT INTO public.chambres_froides (nom, localisation) VALUES ('Chambre Froide Niayes', 'Niayes, Sénégal') RETURNING id INTO v_chambre;

  -- 6 capteurs température
  INSERT INTO public.capteurs (chambre_id, type, emplacement) VALUES
    (v_chambre,'temperature','Haut - Nord'),(v_chambre,'temperature','Haut - Sud'),
    (v_chambre,'temperature','Milieu - Nord'),(v_chambre,'temperature','Milieu - Sud'),
    (v_chambre,'temperature','Bas - Nord'),(v_chambre,'temperature','Bas - Sud');

  -- 3 capteurs humidité
  INSERT INTO public.capteurs (chambre_id, type, emplacement) VALUES
    (v_chambre,'humidite','Mur Est'),(v_chambre,'humidite','Mur Ouest'),(v_chambre,'humidite','Mur Nord');

  -- 1 capteur porte
  INSERT INTO public.capteurs (chambre_id, type, emplacement) VALUES (v_chambre,'porte','Porte principale');

  -- 3 groupes froids
  INSERT INTO public.groupes_froids (chambre_id, nom, consommation_w) VALUES
    (v_chambre,'Groupe froid #1', 850),
    (v_chambre,'Groupe froid #2', 820),
    (v_chambre,'Groupe froid #3', 0);

  -- 8 panneaux solaires
  INSERT INTO public.panneaux_solaires (chambre_id, nom, production_w)
  SELECT v_chambre, 'Panneau #' || i, 450 FROM generate_series(1,8) i;

  -- Batterie 20 kWh
  INSERT INTO public.batteries_solaires (chambre_id, pourcentage, voltage, capacite_kwh) VALUES (v_chambre, 85, 48.2, 20);
END $$;
