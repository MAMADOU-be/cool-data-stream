import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Seuils métiers — MIROIR de src/lib/thresholds.ts
 * ⚠️ Toute modification ici doit être répliquée à l'identique côté front
 *    (src/lib/thresholds.ts) et dans le README.md.
 *
 *   warning  → niveau vigilance (renvoyé dans la réponse, pas d'alerte BDD)
 *   critical → niveau critique  (alerte BDD créée automatiquement)
 */
const THRESHOLDS = {
  temperature: { warning: 2,  critical: 4,  unit: "°C",  op: "gt" },
  humidite:    { warning: 85, critical: 90, unit: "%",   op: "gt" },
  porte:       { warning: 2,  critical: 5,  unit: "min", op: "gt" },
  fumee:       { warning: 20, critical: 50, unit: "ppm", op: "gt" },
} as const;

type ThresholdKey = keyof typeof THRESHOLDS;

function levelOf(key: ThresholdKey, value: number): "ok" | "warning" | "critical" {
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

// Edge function publique : reçoit les payloads des capteurs IoT (HTTP / webhook MQTT bridge)
// POST /ingest-sensor
// body: { capteur_id: uuid, type: 'temperature'|'humidite'|'porte'|'fumee', valeur: number }
//   ou { chambre_id, type, emplacement, valeur } (auto-détection capteur)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { capteur_id, chambre_id: bChambre, type, emplacement, valeur } = body;

    if (typeof valeur !== "number" || !type) {
      return new Response(JSON.stringify({ error: "Champs requis: type, valeur" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let capteur: any = null;
    if (capteur_id) {
      const { data } = await supabase.from("capteurs").select("*").eq("id", capteur_id).maybeSingle();
      capteur = data;
    } else if (bChambre && emplacement) {
      const { data } = await supabase
        .from("capteurs")
        .select("*")
        .eq("chambre_id", bChambre)
        .eq("type", type)
        .eq("emplacement", emplacement)
        .maybeSingle();
      capteur = data;
    }

    if (!capteur) {
      return new Response(JSON.stringify({ error: "Capteur introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: mErr } = await supabase.from("mesures").insert({
      capteur_id: capteur.id,
      chambre_id: capteur.chambre_id,
      type,
      valeur,
    });
    if (mErr) throw mErr;

    // Évaluation des seuils (alignée avec src/lib/thresholds.ts)
    const niveau = THRESHOLDS[type as ThresholdKey] ? levelOf(type as ThresholdKey, valeur) : "ok";

    let alerte: { type: string; message: string; seuil: number } | null = null;
    if (niveau === "critical") {
      const t = THRESHOLDS[type as ThresholdKey];
      if (type === "temperature") {
        alerte = { type: "temperature_high", message: `Température ${valeur}°C > ${t.critical}°C`, seuil: t.critical };
      } else if (type === "humidite") {
        alerte = { type: "humidite_high", message: `Humidité ${valeur}% > ${t.critical}%`, seuil: t.critical };
      } else if (type === "porte") {
        alerte = { type: "porte_ouverte", message: `Porte ouverte depuis ${valeur} min (> ${t.critical} min)`, seuil: t.critical };
      } else if (type === "fumee") {
        alerte = { type: "fumee_detectee", message: `🔥 Fumée détectée : ${valeur} ppm — risque incendie (seuil ${t.critical} ppm)`, seuil: t.critical };
      }
    }

    if (alerte) {
      await supabase.from("alerts").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        type: alerte.type,
        message: alerte.message,
        valeur,
        seuil: alerte.seuil,
        chambre_id: capteur.chambre_id,
        etat: "active",
      });
    }

    return new Response(JSON.stringify({ ok: true, niveau, alerte, seuils: THRESHOLDS[type as ThresholdKey] ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
