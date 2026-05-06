/**
 * Seuils métiers Doundeul Récolte — SOURCE UNIQUE DE VÉRITÉ (front).
 *
 * ⚠️ Toute modification ici doit être répliquée à l'identique dans :
 *   - supabase/functions/ingest-sensor/index.ts  (constante THRESHOLDS)
 *   - README.md (tableau "Seuils métiers")
 *
 * Convention :
 *   - `warning`  → niveau vigilance (UI orange, pas d'alerte BDD)
 *   - `critical` → niveau critique  (UI rouge, alerte BDD créée)
 *   - `op`       → opérateur de comparaison à utiliser ("gt", "lt")
 */
export const THRESHOLDS = {
  temperature: { warning: 2,  critical: 4,  unit: "°C",  op: "gt" as const },
  humidite:    { warning: 85, critical: 90, unit: "%",   op: "gt" as const },
  porte:       { warning: 2,  critical: 5,  unit: "min", op: "gt" as const },
  fumee:       { warning: 20, critical: 50, unit: "ppm", op: "gt" as const },
  batterie:    { warning: 50, critical: 20, unit: "%",   op: "lt" as const },
} as const;

export type ThresholdKey = keyof typeof THRESHOLDS;

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
