import { describe, it, expect } from "vitest";
import {
  temperatureTarget,
  nextTemperature,
  evaluateAlerts,
  type AlertCheck,
} from "@/lib/fridgeSimulation";

describe("temperatureTarget", () => {
  it("reste froid quand tous les groupes sont actifs", () => {
    expect(temperatureTarget(1, false)).toBeLessThanOrEqual(4);
  });
  it("monte fort quand tous les groupes sont éteints", () => {
    expect(temperatureTarget(0, false)).toBeGreaterThan(20);
  });
  it("ajoute un offset quand la porte est ouverte", () => {
    expect(temperatureTarget(1, true)).toBeGreaterThan(temperatureTarget(1, false));
  });
});

describe("nextTemperature", () => {
  it("converge vers une température basse quand les groupes sont allumés", () => {
    let t = 25;
    for (let i = 0; i < 30; i++) t = nextTemperature(t, 1, false);
    expect(t).toBeLessThan(5);
  });
  it("monte progressivement quand les groupes sont coupés", () => {
    let t = 3;
    for (let i = 0; i < 30; i++) t = nextTemperature(t, 0, false);
    expect(t).toBeGreaterThan(20);
  });
});

describe("evaluateAlerts", () => {
  const mk = (type: string, over: boolean): AlertCheck => ({
    type, over, build: () => ({ type, message: type }),
  });

  it("crée une alerte température quand les groupes froids sont coupés", () => {
    const checks = [mk("temperature_high", true)];
    const res = evaluateAlerts(checks, new Set());
    expect(res.toCreate).toHaveLength(1);
    expect(res.toResolveTypes).toEqual([]);
  });

  it("ne duplique pas une alerte déjà active", () => {
    const checks = [mk("temperature_high", true)];
    const res = evaluateAlerts(checks, new Set(["temperature_high"]));
    expect(res.toCreate).toEqual([]);
    expect(res.toResolveTypes).toEqual([]);
  });

  it("résout l'alerte température quand les groupes sont rallumés", () => {
    const checks = [mk("temperature_high", false)];
    const res = evaluateAlerts(checks, new Set(["temperature_high"]));
    expect(res.toCreate).toEqual([]);
    expect(res.toResolveTypes).toEqual(["temperature_high"]);
  });

  it("gère plusieurs types indépendamment", () => {
    const checks = [
      mk("temperature_high", true),
      mk("porte_ouverte", false),
      mk("fumee_detectee", true),
    ];
    const res = evaluateAlerts(checks, new Set(["porte_ouverte", "fumee_detectee"]));
    expect(res.toCreate.map((a) => (a as any).type)).toEqual(["temperature_high"]);
    expect(res.toResolveTypes).toEqual(["porte_ouverte"]);
  });
});
