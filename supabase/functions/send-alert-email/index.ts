// Envoi d'alertes critiques par email via Gmail (connecteur Lovable).
// Anti-spam : un email par type d'alerte toutes les 15 min maximum.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Destinataires autorisés (admin + opérateurs)
const RECIPIENTS = ["jolooftech@gmail.com", "m.keita1601@gmail.com"];

const ANTI_SPAM_MINUTES = 15;

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function b64url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRawEmail(to: string[], subject: string, html: string, text: string): string {
  const boundary = "doundeul_" + Math.random().toString(36).slice(2);
  const lines = [
    `To: ${to.join(", ")}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");
  return b64url(lines);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_KEY) {
      return new Response(JSON.stringify({ error: "Email connector not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { alert_id } = await req.json();
    if (!alert_id) {
      return new Response(JSON.stringify({ error: "alert_id requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: alert, error: aErr } = await supabase
      .from("alerts").select("*").eq("id", alert_id).maybeSingle();
    if (aErr || !alert) {
      return new Response(JSON.stringify({ error: "Alerte introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anti-spam : dernier email du même type dans les 15 dernières minutes ?
    const since = new Date(Date.now() - ANTI_SPAM_MINUTES * 60_000).toISOString();
    const { data: recent } = await supabase
      .from("alerts").select("id")
      .eq("type", alert.type)
      .gte("email_sent_at", since)
      .limit(1);
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "anti-spam" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const when = new Date(alert.created_at).toLocaleString("fr-FR", { timeZone: "Africa/Dakar" });
    const subject = `🚨 Alerte critique — ${alert.type}`;
    const text = `Doundeul Récolte — Alerte critique\n\n${alert.message}\n\nValeur : ${alert.valeur ?? "—"}\nSeuil : ${alert.seuil ?? "—"}\nDate : ${when}\n\nConnectez-vous au tableau de bord pour intervenir.`;
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f7f9;margin:0;padding:24px">
      <table style="max-width:560px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="background:#dc2626;color:#fff;padding:16px 20px;font-size:18px;font-weight:bold">🚨 Alerte critique — Doundeul Récolte</td></tr>
        <tr><td style="padding:20px;color:#111827">
          <p style="font-size:16px;margin:0 0 12px"><strong>${alert.message}</strong></p>
          <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#6b7280">Type</td><td style="padding:6px 0"><code>${alert.type}</code></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Valeur mesurée</td><td style="padding:6px 0">${alert.valeur ?? "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Seuil critique</td><td style="padding:6px 0">${alert.seuil ?? "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Date</td><td style="padding:6px 0">${when}</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#6b7280">Connectez-vous au tableau de bord pour intervenir rapidement.</p>
        </td></tr>
      </table></body></html>`;

    const raw = buildRawEmail(RECIPIENTS, subject, html, text);

    const resp = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GMAIL_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const body = await resp.text();
    if (!resp.ok) {
      console.error("Gmail send failed", resp.status, body);
      return new Response(JSON.stringify({ error: "Échec envoi Gmail", status: resp.status, detail: body }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("alerts")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", alert_id);

    return new Response(JSON.stringify({ ok: true, recipients: RECIPIENTS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
