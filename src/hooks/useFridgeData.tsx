import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type CapteurType = "temperature" | "humidite" | "porte" | "fumee";
export type AlertEtat = "creee" | "active" | "lue" | "resolue";

export interface Chambre { id: string; nom: string; localisation: string }
export interface Capteur { id: string; chambre_id: string; type: CapteurType; emplacement: string; actif: boolean }
export interface Mesure { id: string; capteur_id: string; chambre_id: string; type: CapteurType; valeur: number; timestamp: string }
export interface GroupeFroid { id: string; chambre_id: string; nom: string; reference: string; etat: boolean; consommation_w: number; last_update: string }
export interface Panneau { id: string; chambre_id: string; nom: string; production_w: number; last_update: string }
export interface Batterie { id: string; chambre_id: string; pourcentage: number; voltage: number; capacite_kwh: number; last_update: string }
export interface AlertRow {
  id: string; type: string; message: string; is_read: boolean; created_at: string;
  user_id: string; chambre_id: string | null; valeur: number | null; seuil: number | null; etat: AlertEtat;
}

interface Ctx {
  chambre: Chambre | null;
  capteurs: Capteur[];
  groupes: GroupeFroid[];
  panneaux: Panneau[];
  batterie: Batterie | null;
  latestByCapteur: Record<string, Mesure | undefined>;
  recentMesures: Mesure[]; // dernières 24h pour graphiques
  alerts: AlertRow[];
  // dérivés
  tempMoyenne: number | null;
  humiditeMoyenne: number | null;
  porteOuverte: number | null;
  fumeeMax: number | null;
  productionTotale: number;
  consommationTotale: number;
  // actions
  toggleGroupe: (id: string, etat: boolean) => Promise<void>;
  setAlertState: (id: string, etat: AlertEtat) => Promise<void>;
  refresh: () => Promise<void>;
}

const FridgeContext = createContext<Ctx | undefined>(undefined);

const SIM_KEY = "doundeul:simulation-enabled";

export function FridgeDataProvider({ children }: { children: ReactNode }) {
  const { user, isOperateur } = useAuth();
  const [chambre, setChambre] = useState<Chambre | null>(null);
  const [capteurs, setCapteurs] = useState<Capteur[]>([]);
  const [groupes, setGroupes] = useState<GroupeFroid[]>([]);
  const [panneaux, setPanneaux] = useState<Panneau[]>([]);
  const [batterie, setBatterie] = useState<Batterie | null>(null);
  const [latestByCapteur, setLatest] = useState<Record<string, Mesure | undefined>>({});
  const [recentMesures, setRecent] = useState<Mesure[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const stateRef = useRef({ temp: 3.5, humid: 70, batt: 85 });

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: ch }, { data: cap }, { data: gr }, { data: pa }, { data: ba }, { data: al }] = await Promise.all([
      supabase.from("chambres_froides").select("*").limit(1).maybeSingle(),
      supabase.from("capteurs").select("*").order("type"),
      supabase.from("groupes_froids").select("*").order("nom"),
      supabase.from("panneaux_solaires").select("*").order("nom"),
      supabase.from("batteries_solaires").select("*").limit(1).maybeSingle(),
      supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setChambre(ch as any);
    setCapteurs((cap as any) ?? []);
    setGroupes((gr as any) ?? []);
    setPanneaux((pa as any) ?? []);
    setBatterie(ba as any);
    setAlerts((al as any) ?? []);

    // dernières mesures
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: ms } = await supabase
      .from("mesures").select("*").gte("timestamp", since)
      .order("timestamp", { ascending: false }).limit(2000);
    const list = (ms as Mesure[]) ?? [];
    setRecent(list);
    const map: Record<string, Mesure | undefined> = {};
    for (const m of list) if (!map[m.capteur_id]) map[m.capteur_id] = m;
    setLatest(map);
  }, [user]);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("doundeul-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "mesures" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "groupes_froids" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "batteries_solaires" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refresh]);

  // Simulation des capteurs (BNF-09 : 5 min en prod, 10s pour démo)
  useEffect(() => {
    if (!user || !chambre || capteurs.length === 0 || !isOperateur) return;
    const enabled = localStorage.getItem(SIM_KEY);
    if (enabled === "false") return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      const s = stateRef.current;
      // marche aléatoire
      s.temp = Math.max(-2, Math.min(8, s.temp + (Math.random() - 0.5) * 0.6));
      s.humid = Math.max(40, Math.min(95, s.humid + (Math.random() - 0.5) * 3));
      s.batt = Math.max(10, Math.min(100, s.batt + (Math.random() - 0.55) * 0.8));

      const inserts = capteurs.map((c) => {
        let valeur = 0;
        if (c.type === "temperature") valeur = +(s.temp + (Math.random() - 0.5) * 0.4).toFixed(2);
        else if (c.type === "humidite") valeur = +(s.humid + (Math.random() - 0.5) * 2).toFixed(1);
        else if (c.type === "fumee") valeur = +(Math.random() * 15 + (Math.random() < 0.01 ? 200 : 0)).toFixed(1); // ppm, pic rare
        else valeur = Math.random() < 0.05 ? 1 : 0; // porte
        return { capteur_id: c.id, chambre_id: c.chambre_id, type: c.type, valeur };
      });
      await supabase.from("mesures").insert(inserts);

      // batterie
      if (batterie) {
        const v = +(46 + (s.batt / 100) * 4).toFixed(2);
        await supabase.from("batteries_solaires")
          .update({ pourcentage: +s.batt.toFixed(1), voltage: v, last_update: new Date().toISOString() })
          .eq("id", batterie.id);
      }

      // panneaux : production solaire variable selon l'heure
      const h = new Date().getHours();
      const sunFactor = h >= 7 && h <= 18 ? Math.sin(((h - 7) / 11) * Math.PI) : 0;
      for (const p of panneaux) {
        const prod = +(500 * sunFactor * (0.85 + Math.random() * 0.3)).toFixed(0);
        await supabase.from("panneaux_solaires")
          .update({ production_w: prod, last_update: new Date().toISOString() }).eq("id", p.id);
      }

      // alertes seuils (BF-06)
      const alertes: any[] = [];
      const tempMoy = s.temp;
      if (tempMoy > 4) alertes.push({
        user_id: user.id, type: "temperature_high",
        message: `Température ${tempMoy.toFixed(1)}°C dépasse le seuil de 4°C`,
        valeur: +tempMoy.toFixed(2), seuil: 4, chambre_id: chambre.id, etat: "active",
      });
      if (s.batt < 20) alertes.push({
        user_id: user.id, type: "battery_low",
        message: `Batterie faible : ${s.batt.toFixed(0)}%`,
        valeur: +s.batt.toFixed(1), seuil: 20, chambre_id: chambre.id, etat: "active",
      });
      // Détection fumée : seuil critique 50 ppm
      const fumeeMax = Math.max(0, ...inserts.filter((i) => i.type === "fumee").map((i) => i.valeur));
      if (fumeeMax > 50) alertes.push({
        user_id: user.id, type: "fumee_detectee",
        message: `🔥 Fumée détectée : ${fumeeMax.toFixed(0)} ppm — risque incendie`,
        valeur: fumeeMax, seuil: 50, chambre_id: chambre.id, etat: "active",
      });
      if (alertes.length) {
        // éviter spam : ne créer qu'une alerte du même type par 2 min
        const recent = alerts.filter((a) => Date.now() - new Date(a.created_at).getTime() < 120_000);
        const fresh = alertes.filter((a) => !recent.some((r) => r.type === a.type));
        if (fresh.length) await supabase.from("alerts").insert(fresh);
      }
    };

    tick();
    const interval = setInterval(tick, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, chambre, capteurs, batterie, panneaux, isOperateur, alerts]);

  const tempMesures = recentMesures.filter((m) => m.type === "temperature");
  const humidMesures = recentMesures.filter((m) => m.type === "humidite");
  const tempMoyenne = tempMesures.length
    ? +(tempMesures.slice(0, capteurs.filter((c) => c.type === "temperature").length).reduce((a, b) => a + b.valeur, 0) /
        Math.max(1, capteurs.filter((c) => c.type === "temperature").length)).toFixed(2)
    : null;
  const humiditeMoyenne = humidMesures.length
    ? +(humidMesures.slice(0, capteurs.filter((c) => c.type === "humidite").length).reduce((a, b) => a + b.valeur, 0) /
        Math.max(1, capteurs.filter((c) => c.type === "humidite").length)).toFixed(1)
    : null;
  const porteCapteur = capteurs.find((c) => c.type === "porte");
  const porteOuverte = porteCapteur ? latestByCapteur[porteCapteur.id]?.valeur ?? 0 : null;
  const fumeeCapteurs = capteurs.filter((c) => c.type === "fumee");
  const fumeeMax = fumeeCapteurs.length
    ? Math.max(0, ...fumeeCapteurs.map((c) => latestByCapteur[c.id]?.valeur ?? 0))
    : null;
  const productionTotale = panneaux.reduce((a, p) => a + p.production_w, 0);
  const consommationTotale = groupes.filter((g) => g.etat).reduce((a, g) => a + g.consommation_w, 0);

  const toggleGroupe = async (id: string, etat: boolean) => {
    setGroupes((p) => p.map((g) => g.id === id ? { ...g, etat } : g));
    await supabase.from("groupes_froids").update({ etat, last_update: new Date().toISOString() }).eq("id", id);
  };

  const setAlertState = async (id: string, etat: AlertEtat) => {
    setAlerts((p) => p.map((a) => a.id === id ? { ...a, etat, is_read: etat === "lue" || etat === "resolue" } : a));
    await supabase.from("alerts").update({ etat, is_read: etat === "lue" || etat === "resolue" }).eq("id", id);
  };

  return (
    <FridgeContext.Provider value={{
      chambre, capteurs, groupes, panneaux, batterie,
      latestByCapteur, recentMesures, alerts,
      tempMoyenne, humiditeMoyenne, porteOuverte,
      productionTotale, consommationTotale,
      toggleGroupe, setAlertState, refresh,
    }}>
      {children}
    </FridgeContext.Provider>
  );
}

export function useFridgeData() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error("useFridgeData must be used inside FridgeDataProvider");
  return ctx;
}
