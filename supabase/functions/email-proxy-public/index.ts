import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" }

// Types autorisés depuis le public (sans authentification)
const PUBLIC_ALLOWED_TYPES = [
  "newsletter_welcome",
  "rdv_confirmation",
  "contact_received",
]

// Rate limiting par IP — max 5 requêtes par heure
const ipRateMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateMap.get(ip)
  if (!entry || now > entry.reset) {
    ipRateMap.set(ip, { count: 1, reset: now + 3600000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

function sanitize(str: string): string {
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 2000)
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })

  try {
    // 1. Récupérer l'IP
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown"

    // 2. Rate limiting par IP
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans une heure." }),
        { status: 429, headers: JSON_HEADERS }
      )
    }

    // 3. Parser le body
    const body = await req.text()
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Body vide" }),
        { status: 400, headers: JSON_HEADERS }
      )
    }

    let payload: { type: string; to: string; data?: Record<string, string> }
    try {
      payload = JSON.parse(body)
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON invalide" }),
        { status: 400, headers: JSON_HEADERS }
      )
    }

    // 4. Valider le type — seulement les types publics autorisés
    if (!PUBLIC_ALLOWED_TYPES.includes(payload.type)) {
      return new Response(
        JSON.stringify({ error: "Type non autorisé" }),
        { status: 403, headers: JSON_HEADERS }
      )
    }

    // 5. Valider l'email destinataire
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!payload.to || !emailRegex.test(payload.to)) {
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 400, headers: JSON_HEADERS }
      )
    }

    // 6. Sanitiser toutes les données
    if (payload.data) {
      for (const key of Object.keys(payload.data)) {
        payload.data[key] = sanitize(String(payload.data[key]))
      }
    }

    // 7. Appeler send-email avec le secret interne
    const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET")!
    const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!

    const res = await fetch(SUPABASE_URL + "/functions/v1/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[email-proxy-public] send-email error:", err)
      throw new Error(err)
    }

    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS })

  } catch (err) {
    console.error("[email-proxy-public]", err)
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: JSON_HEADERS }
    )
  }
})

