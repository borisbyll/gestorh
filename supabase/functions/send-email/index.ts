const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const JH = { ...CORS, "Content-Type": "application/json" }

const ALLOWED_TYPES = [
  "newsletter_welcome",
  "newsletter_custom",
  "rdv_confirmation",
  "rdv_confirmed",
  "rdv_cancelled",
  "contact_received",
  "test_results",
  "test_alert_admin",
]

function sanitize(str: string): string {
  return str
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .slice(0, 2000)
}

function buildEmailHtml(type: string, data: Record<string, string> = {}): { subject: string; html: string } {
  const base = (subject: string, body: string) => ({
    subject,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
      .card{background:#fff;border-radius:8px;padding:32px;max-width:560px;margin:0 auto}
      h2{color:#1a2744;margin-top:0} p{color:#444;line-height:1.6}
      .btn{display:inline-block;background:#c8a84b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px}
      .info{background:#f0f4ff;border-left:4px solid #1a2744;padding:12px 16px;border-radius:4px;margin:16px 0}
      .footer{text-align:center;color:#888;font-size:12px;margin-top:24px}
    </style></head><body><div class="card">${body}
    <div class="footer"><p>Cabinet GESTORH — Hédzranawoé, Rue N°4, Lomé, Togo<br>Tél : +228 98 91 23 69</p></div>
    </div></body></html>`,
  })

  switch (type) {
    case "rdv_confirmation":
      return base(
        "Confirmation de votre demande de RDV — GESTORH",
        `<h2>Demande de RDV reçue ✓</h2>
        <p>Bonjour <strong>${data.nom || ""},</strong></p>
        <p>Nous avons bien reçu votre demande de rendez-vous. Notre équipe vous contactera sous <strong>24 à 48h</strong> pour confirmer le créneau.</p>
        <div class="info">
          <strong>Service :</strong> ${data.service || "-"}<br>
          <strong>Date souhaitée :</strong> ${data.date || "-"}
        </div>
        <a href="https://cabinet-gestorh.com/contact" class="btn">Nous contacter</a>`,
      )

    case "rdv_confirmed":
      return base(
        "Votre RDV est confirmé — GESTORH",
        `<h2>Rendez-vous confirmé ✓</h2>
        <p>Bonjour <strong>${data.nom || ""},</strong></p>
        <p>Votre rendez-vous est officiellement confirmé.</p>
        <div class="info">
          <strong>Service :</strong> ${data.service || "-"}<br>
          <strong>Date :</strong> ${data.date || "-"}<br>
          <strong>Heure :</strong> ${data.time || "-"}
        </div>
        <p>Adresse : Hédzranawoé, Rue N°4, Lomé — Togo</p>`,
      )

    case "rdv_cancelled":
      return base(
        "Annulation de RDV — GESTORH",
        `<h2>Rendez-vous annulé</h2>
        <p>Bonjour <strong>${data.nom || ""},</strong></p>
        <p>Votre rendez-vous du <strong>${data.date || "-"}</strong> a été annulé. Contactez-nous pour reprogrammer.</p>
        <a href="https://cabinet-gestorh.com/rendez-vous" class="btn">Reprendre RDV</a>`,
      )

    case "contact_received":
      return base(
        `Nouveau message de ${data.nom || "contact"} — GESTORH`,
        `<h2>Nouveau message reçu</h2>
        <div class="info">
          <strong>Nom :</strong> ${data.nom || "-"}<br>
          <strong>Email :</strong> ${data.email || "-"}<br>
          <strong>Téléphone :</strong> ${data.phone || "-"}<br>
          <strong>Service :</strong> ${data.service || "-"}
        </div>
        <p><strong>Message :</strong></p>
        <p>${(data.message || "").replace(/\n/g, "<br>")}</p>`,
      )

    case "newsletter_welcome":
      return base(
        "Bienvenue dans la newsletter GESTORH",
        `<h2>Bienvenue !</h2>
        <p>Bonjour <strong>${data.nom || ""},</strong></p>
        <p>Vous êtes maintenant inscrit(e) à la newsletter du Cabinet GESTORH. Vous recevrez nos conseils RH, psychologie et bien-être.</p>
        <a href="https://cabinet-gestorh.com/desabonnement?email=${encodeURIComponent(data.email || "")}" class="btn" style="background:#888">Se désabonner</a>`,
      )

    case "newsletter_custom":
      return base(
        data.subject || "Newsletter GESTORH",
        `<h2>${data.subject || "Newsletter"}</h2>
        <div>${data.content || ""}</div>
        <a href="https://cabinet-gestorh.com/desabonnement?email=${encodeURIComponent(data.email || "")}" class="btn" style="background:#888">Se désabonner</a>`,
      )

    case "test_results":
      return base(
        `Résultats de votre test "${data.test_name || ""}" — GESTORH`,
        `<h2>Vos résultats</h2>
        <p>Bonjour <strong>${data.nom || ""},</strong></p>
        <div class="info">
          <strong>Test :</strong> ${data.test_name || "-"}<br>
          <strong>Résultat :</strong> ${data.result_name || "-"}
        </div>
        <p>${data.advice || ""}</p>
        <a href="https://cabinet-gestorh.com/rendez-vous" class="btn">Prendre RDV</a>`,
      )

    case "test_alert_admin":
      return base(
        `[ALERTE] Résultat critique — ${data.test_name || "test"}`,
        `<h2>⚠ Résultat à risque détecté</h2>
        <div class="info">
          <strong>Nom :</strong> ${data.nom || "-"}<br>
          <strong>Email :</strong> ${data.email || "-"}<br>
          <strong>Test :</strong> ${data.test_name || "-"}<br>
          <strong>Niveau :</strong> ${data.result_name || "-"}
        </div>`,
      )

    default:
      return base("Message de GESTORH", `<p>${data.message || ""}</p>`)
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })

  try {
    // 1. Vérifier le secret interne (appels depuis email-proxy ou email-proxy-public uniquement)
    const secret = req.headers.get("x-internal-secret")
    if (!secret || secret !== Deno.env.get("INTERNAL_SECRET")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: JH })
    }

    // 2. Valider le payload
    const body = await req.text()
    if (!body) return new Response(JSON.stringify({ error: "Body vide" }), { status: 400, headers: JH })

    let payload: { type: string; to: string; data?: Record<string, string> }
    try { payload = JSON.parse(body) }
    catch { return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400, headers: JH }) }

    if (!ALLOWED_TYPES.includes(payload.type)) {
      return new Response(JSON.stringify({ error: "Type non autorisé" }), { status: 403, headers: JH })
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to || "")
    if (!emailOk) return new Response(JSON.stringify({ error: "Email invalide" }), { status: 400, headers: JH })

    // 3. Sanitiser les données
    const safeData: Record<string, string> = {}
    for (const [k, v] of Object.entries(payload.data || {})) {
      safeData[k] = sanitize(String(v))
    }

    // 4. Construire et envoyer l'email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!
    const { subject, html } = buildEmailHtml(payload.type, safeData)

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    "GESTORH <noreply@cabinet-gestorh.com>",
        to:      [payload.to],
        subject,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error("[send-email] Resend error:", err)
      throw new Error("Erreur envoi email")
    }

    return new Response(JSON.stringify({ ok: true }), { headers: JH })

  } catch (err) {
    console.error("[send-email]", err)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers: JH })
  }
})
