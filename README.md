# Doundal Récolte — Supervision chambre froide solaire

Application de supervision IoT pour une **chambre froide alimentée en solaire** située dans un entrepôt agricole (région des Niayes, Sénégal).

## Périmètre fonctionnel

### Besoins fonctionnels

| ID | Besoin | Description | Priorité |
|----|--------|-------------|----------|
| BF-01 | Authentification | Login / mot de passe + JWT | Haute |
| BF-02 | Surveillance température | Capteurs T° (haut, milieu, bas) — seuil 4°C | Haute |
| BF-03 | Surveillance humidité | Capteurs muraux — affichage temps réel | Haute |
| BF-04 | Surveillance porte | Détection porte ouverte > 5 min | Moyenne |
| BF-05 | Énergie solaire | Production panneaux + état batterie | Haute |
| BF-06 | Alertes & notifications | Création automatique selon seuils, états créée → active → lue → résolue | Haute |
| BF-07 | Contrôle groupes froids | On/Off à distance (admin / opérateur) | Haute |
| BF-08 | Historique & graphiques | Courbes 24h / 7j / 30j (Recharts) | Moyenne |
| BF-09 | Gestion utilisateurs & rôles | admin / opérateur / agriculteur / user | Haute |
| **BF-10** | **Sécurité incendie** | **Détecteurs de fumée (2 par chambre) — alerte critique > 50 ppm** | **Haute** |
| BF-11 | Ingestion IoT | Endpoint HTTP `ingest-sensor` pour capteurs / pont MQTT | Haute |

### Besoins non fonctionnels

| ID | Catégorie | Exigence |
|----|-----------|----------|
| BNF-01 | Performance | Latence affichage < 2 s |
| BNF-02 | Disponibilité | 99 % (autonomie solaire 72 h) |
| BNF-03 | Sécurité | Auth + RLS Supabase + rôles |
| BNF-04 | Compatibilité | Web responsive (mobile / tablette / desktop) |
| BNF-05 | Ergonomie | Interface FR, accessible aux agriculteurs |
| BNF-06 | Scalabilité | Historique ≥ 1 an |
| BNF-07 | Environnement | Fonctionnement -10°C à +50°C |
| BNF-08 | Maintenance | Rétablissement < 1 h |
| BNF-09 | Fréquence mesures | Toutes les 5 min |
| BNF-10 | Autonomie | 72 h sans soleil |
| **BNF-11** | **Sécurité incendie** | **Détection fumée < 30 s, alerte temps réel via Supabase Realtime** |

## Capteurs installés (par chambre froide)

- **Température** : 3 capteurs (haut, milieu, bas)
- **Humidité** : 3 capteurs (mur Est, Ouest, Nord)
- **Porte** : 1 capteur d'ouverture
- **Fumée** : **2 détecteurs** (plafond zone groupes froids, plafond zone stockage)

## Seuils métiers (source unique)

Définis dans `src/lib/thresholds.ts` (front) et **mirorés à l'identique** dans `supabase/functions/ingest-sensor/index.ts` (backend).
Toute modification doit être appliquée aux **deux fichiers + ce tableau**.

| Grandeur     | Vigilance (UI orange) | Critique (UI rouge + alerte BDD) | Comparaison |
|--------------|-----------------------|----------------------------------|-------------|
| Température  | > 2 °C                | > 4 °C                           | supérieur à |
| Humidité     | > 85 %                | > 90 %                           | supérieur à |
| Porte        | > 2 min               | > 5 min                          | supérieur à |
| **Fumée**    | **> 20 ppm**          | **> 50 ppm**                     | supérieur à |
| Batterie     | < 50 %                | < 20 %                           | inférieur à |

Comportement :
- **Vigilance** : indication visuelle uniquement (StatCard / cartes capteurs en orange). L'edge function renvoie `niveau: "warning"` mais ne crée **pas** d'alerte en BDD.
- **Critique** : UI rouge + insertion automatique d'une ligne dans `alerts` (état `active`), diffusée en temps réel via Supabase Realtime.

## Architecture

- **Frontend** : React 18 + Vite + Tailwind + shadcn/ui
- **Backend** : Lovable Cloud (Supabase) — Postgres + RLS + Realtime + Edge Functions
- **Ingestion IoT** : `POST /functions/v1/ingest-sensor` (publique, à sécuriser via signature côté pont MQTT)
- **Simulation** : générateur intégré (8 s en démo, 5 min en prod) configurable depuis Réglages

## Cas d'usage admin / opérateur

- Admin : gestion des rôles utilisateurs, configuration des capteurs, doc API ingestion
- Opérateur : contrôle on/off des groupes froids, traitement des alertes
- Agriculteur / user : consultation dashboard, historique, alertes
