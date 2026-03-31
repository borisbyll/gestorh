import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
}

const SYSTEM = `Tu es l'assistant virtuel officiel du Cabinet GESTORH, situé à Lomé, Togo.

SERVICES GESTORH :
- Solutions RH (audit, recrutement, outils, prévention risques)
- Coaching professionnel et leadership
- Accompagnement psychologique et soutien moral
- Thérapie de couple et famille
- Tests et bilans diagnostics gratuits

COORDONNÉES :
- Adresse : Hédzranawoé, Rue N°4, Lomé, Togo
- Tél : +228 98 91 23 69 / +228 90 03 61 87
- Horaires : Lun-Ven 08h-18h, Sam 09h-16h

TON RÔLE :
- Répondre chaleureusement aux questions sur nos services
- Orienter vers le bon service selon la situation
- Encourager la prise de RDV quand c'est pertinent
- Donner des conseils généraux sur le bien-être professionnel

RÈGLES :
- Jamais de diagnostic médical ou psychologique précis
- Ne jamais mentionner de concurrents
- Toujours proposer un RDV si la situation semble sérieuse
- Répondre en français, de façon chaleureuse et professionnelle
- Maximum 3 paragraphes courts sauf si demande spécifique`

// Rate limiting par IP + sessionId
const rl = new Map<string, { n: number; reset: number }>()

function allowed(key: string, limit: number): boolean {
  const now = Date.now()
  const e = rl.get(key)
  if (!e || now > e.reset) { rl.set(key, { n: 1, reset: now + 3_600_000 }); return true }
  if (e.n >= limit) return false
  e.n++; return true
}

// Nettoyer les entrées expirées toutes les heures
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of rl.entries()) {
    if (now > v.reset) rl.delete(k)
  }
}, 3_600_000)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { messages, sessionId } = await req.json()

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Payload invalide' }), { status: 400, headers: CORS })
    }

    // Rate limit par IP (15 req/heure) ET par session (20 req/heure)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
              || req.headers.get('x-real-ip')
              || 'unknown'

    if (!allowed(`ip:${ip}`, 15)) {
      return new Response(JSON.stringify({ error: 'Limite atteinte. Réessayez dans une heure.' }), { status: 429, headers: CORS })
    }
    if (!allowed(`sid:${sessionId || 'anon'}`, 20)) {
      return new Response(JSON.stringify({ error: 'Limite atteinte. Réessayez dans une heure.' }), { status: 429, headers: CORS })
    }

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const safe = messages
      .slice(-10)
      .map((m: { role: string; content: string }) => ({
        role:    m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: String(m.content).slice(0, 1500),
      }))

    const res = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system:     SYSTEM,
      messages:   safe,
    })

    const content = res.content[0]?.type === 'text'
      ? res.content[0].text
      : 'Je n\'ai pas pu générer une réponse. Contactez-nous au +228 98 91 23 69.'

    return new Response(JSON.stringify({ content }), { headers: CORS })

  } catch (err) {
    console.error('[chat-ai]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: CORS })
  }
})