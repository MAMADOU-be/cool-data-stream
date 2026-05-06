import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Edge function publique : reçoit les payloads des capteurs IoT (HTTP / webhook MQTT bridge)
// POST /ingest-sensor
// body: { capteur_id: uuid, type: 'temperature'|'humidite'|'porte', valeur: number }
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

    // Vérification des seuils
    let alerte: { type: string; message: string; seuil: number } | null = null;
    if (type === "temperature" && valeur > 4) {
      alerte = { type: "temperature_high", message: `Température ${valeur}°C > 4°C`, seuil: 4 };
    }
    if (type === "porte" && valeur > 5) {
      alerte = { type: "porte_ouverte", message: `Porte ouverte depuis ${valeur} min`, seuil: 5 };
    }
    if (type === "fumee" && valeur > 50) {
      alerte = { type: "fumee_detectee", message: `🔥 Fumée détectée : ${valeur} ppm — risque incendie`, seuil: 50 };
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

    return new Response(JSON.stringify({ ok: true, alerte }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
