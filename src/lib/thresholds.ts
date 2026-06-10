/**
 * Seuils métiers Doundeul Récolte — SOURCE UNIQUE DE VÉRITÉ (front).
 *
 * Les valeurs par défaut sont définies ici. L'utilisateur peut les surcharger
 * depuis la page Paramètres ; les overrides sont stockés dans localStorage
 * sous la clé `doundeul:thresholds` et appliqués immédiatement.
 *
 * ⚠️ Toute modification des valeurs par défaut doit être répliquée dans :
 *   - supabase/functions/ingest-sensor/index.ts  (constante THRESHOLDS)
 *   - README.md (tableau "Seuils métiers")
 */

export const THRESHOLD_STORAGE_KEY = "doundeul:thresholds";

export const DEFAULT_THRESHOLDS = {
  temperature: { warning: 2,  critical: 4,  unit: "°C",  op: "gt" as const },
  humidite:    { warning: 85, critical: 90, unit: "%",   op: "gt" as const },
  porte:       { warning: 2,  critical: 5,  unit: "min", op: "gt" as const },
  fumee:       { warning: 20, critical: 50, unit: "ppm", op: "gt" as const },
  batterie:    { warning: 50, critical: 20, unit: "%",   op: "lt" as const },
} as const;

export type ThresholdKey = keyof typeof DEFAULT_THRESHOLDS;
export type ThresholdConfig = {
  [K in ThresholdKey]: { warning: number; critical: number; unit: string; op: "gt" | "lt" };
};

function loadOverrides(): Partial<Record<ThresholdKey, { warning: number; critical: number }>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(THRESHOLD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildThresholds(): ThresholdConfig {
  const ov = loadOverrides();
  const out = {} as ThresholdConfig;
  (Object.keys(DEFAULT_THRESHOLDS) as ThresholdKey[]).forEach((k) => {
    const d = DEFAULT_THRESHOLDS[k];
    const o = ov[k];
    out[k] = {
      warning: o?.warning ?? d.warning,
      critical: o?.critical ?? d.critical,
      unit: d.unit,
      op: d.op,
    };
  });
  return out;
}

// Proxy live : relit le localStorage à chaque accès pour refléter les changements
// faits depuis la page Paramètres sans recharger l'app.
export const THRESHOLDS: ThresholdConfig = new Proxy({} as ThresholdConfig, {
  get(_t, prop: string) {
    return buildThresholds()[prop as ThresholdKey];
  },
  ownKeys() { return Object.keys(DEFAULT_THRESHOLDS); },
  getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },
});

export function getThresholds(): ThresholdConfig { return buildThresholds(); }

export function saveThresholds(values: Partial<Record<ThresholdKey, { warning: number; critical: number }>>) {
  localStorage.setItem(THRESHOLD_STORAGE_KEY, JSON.stringify(values));
}

export function resetThresholds() { localStorage.removeItem(THRESHOLD_STORAGE_KEY); }

/** Renvoie "ok" | "warning" | "critical" pour une valeur donnée. */
export function levelOf(key: ThresholdKey, value: number | null | undefined): "ok" | "warning" | "critical" {
  if (value === null || value === undefined) return "ok";
  const t = THRESHOLDS[key];
  if (t.op === "gt") {
    if (value > t.critical) return "critical";
    if (value > t.warning) return "warning";
    return "ok";
  }
  if (value < t.critical) return "critical";
  if (value < t.warning) return "warning";
  return "ok";
}
