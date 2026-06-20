/**
 * Logique pure de simulation des capteurs.
 * Aucune dépendance Supabase / React — entièrement testable.
 */

export interface SimState {
  temp: number;
  humid: number;
  batt: number;
  porteOpen: boolean;
  porteOpenMin: number;
}

/** Cible de température en fonction du ratio de groupes froids actifs. */
export function temperatureTarget(ratioFroid: number, porteOpen: boolean): number {
  return 3 + (1 - ratioFroid) * 25 + (porteOpen ? 3 : 0);
}

/** Pas suivant pour la température (rapproche `prev` de la cible). */
export function nextTemperature(prev: number, ratioFroid: number, porteOpen: boolean, jitter = 0): number {
  const target = temperatureTarget(ratioFroid, porteOpen);
  const speed = ratioFroid > 0 ? 0.6 : 0.35;
  const next = prev + (target - prev) * speed + jitter;
  return Math.max(-2, Math.min(35, +next.toFixed(2)));
}

export interface AlertCheck {
  type: string;
  over: boolean;
  build: () => Record<string, unknown>;
}

export interface EvaluateResult {
  toCreate: Record<string, unknown>[];
  toResolveTypes: string[];
}

/**
 * Décide quelles alertes créer / résoudre en fonction des checks et des alertes
 * déjà actives. Garantit qu'il n'y a jamais plus d'une alerte active par type.
 */
export function evaluateAlerts(
  checks: AlertCheck[],
  activeTypes: Set<string>,
): EvaluateResult {
  const toCreate: Record<string, unknown>[] = [];
  const toResolveTypes: string[] = [];
  for (const c of checks) {
    const exists = activeTypes.has(c.type);
    if (c.over && !exists) toCreate.push(c.build());
    else if (!c.over && exists) toResolveTypes.push(c.type);
  }
  return { toCreate, toResolveTypes };
}
