const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"}
const JH = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"}

const ALLOWED_TYPES = ["newsletter_welcome","newsletter_custom","rdv_confirmation","rdv_confirmed","rdv_cancelled","contact_received","test_results","test_alert_admin"]

const rateLimitMap = new Map<string, {count:number; reset:number}>()

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const e = rateLimitMap.get(key)
  if (!e || now > e.reset) { rateLimitMap.set(key, {count:1, reset:now+windowMs}); return true }
  if (e.count >= max) return false
  e.count++
  return true
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {status:204, headers:CORS})
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({error:"Non autorise"}), {status:401, headers:JH})
    }

    const token = authHeader.replace("Bearer ", "")
    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // Valider le token via l'API REST Supabase Auth
    const authRes = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: {
        "Authorization": "Bearer " + token,
        "apikey": serviceRoleKey,
      }
    })

    if (!authRes.ok) {
      console.error("[email-proxy] Auth failed:", authRes.status)
      return new Response(JSON.stringify({error:"Token invalide"}), {status:401, headers:JH})
    }

    const userData = await authRes.json()
    const userId = userData?.id
    if (!userId) {
      return new Response(JSON.stringify({error:"Token invalide"}), {status:401, headers:JH})
    }

    if (!checkRateLimit(userId, 20, 3600000)) {
      return new Response(JSON.stringify({error:"Limite atteinte"}), {status:429, headers:JH})
    }

    const body = await req.text()
    if (!body) return new Response(JSON.stringify({error:"Body vide"}), {status:400, headers:JH})

    let payload: {type:string; to:string; data?: Record<string,string>}
    try { payload = JSON.parse(body) }
    catch { return new Response(JSON.stringify({error:"JSON invalide"}), {status:400, headers:JH}) }

    if (!ALLOWED_TYPES.includes(payload.type)) {
      return new Response(JSON.stringify({error:"Type non autorise"}), {status:403, headers:JH})
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to || "")
    if (!emailOk) return new Response(JSON.stringify({error:"Email invalide"}), {status:400, headers:JH})

    const sanitize = (s: string) => s.replace(/<script[^>]*>.*?<\/script>/gi,"").slice(0,5000)
    if (payload.data) {
      for (const k of Object.keys(payload.data)) payload.data[k] = sanitize(String(payload.data[k]))
    }

    const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET")!
    const res = await fetch(supabaseUrl + "/functions/v1/send-email", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-internal-secret":INTERNAL_SECRET},
      body:JSON.stringify(payload)
    })

    if (!res.ok) {
      const e = await res.text()
      console.error("[email-proxy] send-email error:", e)
      throw new Error(e)
    }

    return new Response(JSON.stringify({ok:true}), {headers:JH})

  } catch(err) {
    console.error("[email-proxy]", err)
    return new Response(JSON.stringify({error:"Erreur serveur"}), {status:500, headers:JH})
  }
})
