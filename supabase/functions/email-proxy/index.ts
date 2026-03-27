import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" }

// Types d'emails autorisés depuis le frontend
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

// Rate limiting simple en mémoire
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })

  try {
    // 1. Verifier JWT Supabase
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorise" }), { status: 401, headers: JSON_HEADERS })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token invalide" }), { status: 401, headers: JSON_HEADERS })
    }

    // 2. Rate limiting par utilisateur (20 emails par heure)
    if (!checkRateLimit(user.id, 20, 3600000)) {
      return new Response(JSON.stringify({ error: "Limite atteinte" }), { status: 429, headers: JSON_HEADERS })
    }

    // 3. Valider le payload
    const body = await req.text()
    if (!body) {
      return new Response(JSON.stringify({ error: "Body vide" }), { status: 400, headers: JSON_HEADERS })
    }

    let payload: { type: string; to: string; data?: Record<string, string> }
    try {
      payload = JSON.parse(body)
    } catch {
      return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400, headers: JSON_HEADERS })
    }

    // 4. Valider le type d'email
    if (!ALLOWED_TYPES.includes(payload.type)) {
      return new Response(JSON.stringify({ error: "Type non autorise" }), { status: 403, headers: JSON_HEADERS })
    }

    // 5. Valider l'email destinataire
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!payload.to || !emailRegex.test(payload.to)) {
      return new Response(JSON.stringify({ error: "Email invalide" }), { status: 400, headers: JSON_HEADERS })
    }

    // 6. Sanitiser les données
    const sanitize = (str: string) => str
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<object[\s\S]*?<\/object>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/javascript:/gi, "")
      .slice(0, 2000)
    if (payload.data) {
      for (const key of Object.keys(payload.data)) {
        payload.data[key] = sanitize(String(payload.data[key]))
      }
    }

    // 7. Appeler send-email avec le secret interne
    const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET")!
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!

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
      console.error("[email-proxy] send-email error:", err)
      throw new Error(err)
    }

    // 8. Logger dans email_queue pour audit
    await supabase.from("email_queue").insert({
      type:     payload.type,
      to_email: payload.to,
      data:     payload.data || {},
      status:   "sent",
      sent_at:  new Date().toISOString(),
    }).then(() => {})

    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS })

  } catch (err) {
    console.error("[email-proxy]", err)
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers: JSON_HEADERS })
  }
})