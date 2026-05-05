
-- 1. Étendre l'enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operateur';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agriculteur';
