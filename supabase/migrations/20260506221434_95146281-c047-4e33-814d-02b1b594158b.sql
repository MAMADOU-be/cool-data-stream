-- Ajout du capteur de fumée pour la sécurité incendie
ALTER TYPE public.capteur_type ADD VALUE IF NOT EXISTS 'fumee';
