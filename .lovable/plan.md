# Plan — Document "Spécifications techniques" (PDF) adapté à Doundeul Récolte

Objectif : reprendre la structure du document fourni (Yollë) et la réécrire fidèlement pour **notre projet réel** : supervision IoT d'une chambre froide solaire (React + Vite + Lovable Cloud / Supabase), sans inventer de technos non utilisées (pas de Flutter/Dart, pas de Python, pas de MongoDB, pas de Cloudinary, pas de Google Maps).

## Contenu du PDF

Même plan que l'original, contenu remplacé :

1. **Spécifications techniques** (intro)
2. **Langages de programmation utilisés**
   - TypeScript (front + edge functions)
   - JavaScript (runtime navigateur / Deno côté edge)
   - SQL / PL-pgSQL (migrations, politiques RLS, fonctions `security definer`)
3. **Frameworks & bibliothèques**
   - React 18 + Vite 5
   - Tailwind CSS v3 + shadcn/ui (design system "ultra-sophistiqué", thème clair/sombre)
   - TanStack Query (cache & temps réel)
   - Recharts (graphes Historique 24h/7j/30j)
   - React Router, React Hook Form + Zod
4. **Backend — Lovable Cloud (Supabase)**
   - PostgreSQL managé + Row Level Security
   - Supabase Realtime (diffusion alertes < 30 s, dont fumée)
   - Edge Functions Deno : `ingest-sensor` (ingestion IoT publique)
   - Auth Supabase (actuellement désactivée pour la phase de tests)
5. **Architecture logicielle**
   - Schéma ASCII : Capteurs IoT (T°, humidité, porte, **fumée ×2/chambre**) → Pont MQTT/HTTP → Edge Function `ingest-sensor` → Postgres (`mesures`, `alerts`) → Realtime → Front React (Dashboard, Alertes, Historique, Admin)
6. **API & intégrations externes**
   - Supabase JS Client (`@supabase/supabase-js`)
   - Pas d'API tierce de cartographie ni de média : projet site-unique (entrepôt Niayes)
7. **Outils utilisés**
   - Lovable (IDE IA + preview)
   - VS Code, GitHub, Git
   - draw.io (diagrammes UC / classes / séquence / déploiement)
   - Trello (suivi tâches)
   - Vitest (tests unitaires)
8. **Sécurité**
   - HTTPS (Lovable Cloud)
   - CORS configuré sur l'edge function `ingest-sensor`
   - RLS Postgres + fonction `has_role` (security definer, table `user_roles` séparée)
   - Seuils miroir front/back (`src/lib/thresholds.ts` ↔ `ingest-sensor`)
9. **SGBD utilisé**
   - PostgreSQL (via Lovable Cloud / Supabase) — relationnel, tables : `chambres_froides`, `capteurs`, `mesures`, `alerts`, `groupes_froids`, `panneaux_solaires`, `batteries_solaires`, `user_roles`
10. **Présentation de la solution** : rappel court (dashboard temps réel, alertes incendie/temp/humidité/porte/batterie, historique, contrôle groupes froids, simulateur intégré).

## Mise en forme PDF

- Génération via **ReportLab Platypus** (Python) — titres, sous-titres, paragraphes justifiés, tableaux encadrés, puces.
- Police par défaut Helvetica ; titres en gras bleu nuit (cohérent avec le thème "ultra-sophistiqué" de l'app).
- Pas d'images de logos externes (évite les téléchargements / droits) — remplacés par des **encadrés "Logo : <techno>"** ou simplement omis ; le texte reste le contenu principal demandé.
- Pagination en pied de page.
- Sortie : `/mnt/documents/specifications_techniques_doundeul_recolte.pdf`.
- QA visuelle obligatoire : conversion en images via `pdftoppm` et relecture page par page avant livraison.

## Détails techniques d'exécution (build mode)

- Script Python unique dans `/tmp/gen_specs.py`.
- Dépendances déjà disponibles (reportlab dans l'image standard ; sinon `pip install reportlab`).
- Après génération : `pdftoppm -jpeg -r 120 /mnt/documents/...pdf /tmp/qa_page` puis inspection des images.
- Livraison via `<presentation-artifact path="specifications_techniques_doundeul_recolte.pdf" mime_type="application/pdf">`.

## Hors périmètre

- Pas de modifications du code applicatif.
- Pas de logos téléchargés (sauf demande explicite).
- Pas de version DOCX (sauf demande).
