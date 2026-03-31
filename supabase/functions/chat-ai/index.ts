import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
}

const ALL_SLOTS = ['08:00','09:15','10:30','11:45','14:00','15:15','16:30']

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr)
  return d.getDay() === 0 || d.getDay() === 6
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

// Récupérer les créneaux disponibles pour les 7 prochains jours ouvrables
async function getAvailableSlots(): Promise<string> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Générer les 7 prochains jours ouvrables
    const workDays: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let d = new Date(today)
    d.setDate(d.getDate() + 1) // commencer demain
    while (workDays.length < 7) {
      const str = d.toISOString().split('T')[0]
      if (!isWeekend(str)) workDays.push(str)
      d.setDate(d.getDate() + 1)
    }

    // Récupérer les réservations existantes
    const { data: booked } = await supabase
      .from('appointments')
      .select('date, time_slot')
      .in('date', workDays)
      .in('status', ['pending', 'confirmed'])

    const bookedMap: Record<string, Set<string>> = {}
    for (const b of (booked || [])) {
      if (!bookedMap[b.date]) bookedMap[b.date] = new Set()
      bookedMap[b.date].add(b.time_slot)
    }

    // Construire le résumé des disponibilités
    const lines: string[] = []
    for (const day of workDays) {
      const taken = bookedMap[day] || new Set()
      const free = ALL_SLOTS.filter(s => !taken.has(s))
      if (free.length === 0) {
        lines.push(`- ${formatDate(day)} : complet`)
      } else {
        lines.push(`- ${formatDate(day)} : ${free.join(', ')}`)
      }
    }

    return lines.join('\n')
  } catch {
    return 'Calendrier temporairement indisponible. Appelez le +228 98 91 23 69.'
  }
}

const SYSTEM_BASE = `Tu es l'assistant virtuel officiel du Cabinet GESTORH, situé à Lomé, Togo.

DIRECTEUR ET PSYCHOLOGUE PRINCIPAL :
- Nom : Prudence T. LAWSON
- Titre : Psychologue / Expert en Management d'Équipes / Directeur
- Email : centregestorh@gmail.com

SERVICES GESTORH :
- Développement professionnel : coaching, leadership, gestion de carrière
- Bien-être personnel : accompagnement psychologique, soutien moral, thérapie individuelle
- Solution RH : audit RH, recrutement, outils RH, prévention des risques
- Thérapie de couple et famille
- Tests et bilans diagnostics gratuits

COORDONNÉES :
- Adresse : Hédzranawoé, Rue N°4, 01 BP 3353 Lomé, Togo
- Tél : +228 98 91 23 69 / +228 90 03 61 87
- Email : contact@cabinet-gestorh.com
- Horaires : Lun-Ven 08h-18h, Sam 09h-16h

TON RÔLE :
- Répondre chaleureusement aux questions sur les services du cabinet
- Orienter vers le bon service selon la situation du client
- Proposer des créneaux disponibles quand un client souhaite prendre rendez-vous
- Encourager la prise de RDV quand c'est pertinent
- Donner des conseils généraux sur le bien-être professionnel

RÈGLES :
- Ne jamais poser de diagnostic médical ou psychologique précis
- Ne jamais mentionner de concurrents
- Toujours proposer un RDV si la situation semble sérieuse
- Répondre en français, de façon chaleureuse et professionnelle
- Maximum 3 paragraphes courts sauf si demande spécifique
- Pour les RDV en ligne : diriger vers cabinet-gestorh.com/rendez-vous`

// Rate limiting par IP + sessionId
const rl = new Map<string, { n: number; reset: number }>()

function allowed(key: string, limit: number): boolean {
  const now = Date.now()
  const e = rl.get(key)
  if (!e || now > e.reset) { rl.set(key, { n: 1, reset: now + 3_600_000 }); return true }
  if (e.n >= limit) return false
  e.n++; return true
}

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

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
              || req.headers.get('x-real-ip')
              || 'unknown'

    if (!allowed(`ip:${ip}`, 15)) {
      return new Response(JSON.stringify({ error: 'Limite atteinte. Réessayez dans une heure.' }), { status: 429, headers: CORS })
    }
    if (!allowed(`sid:${sessionId || 'anon'}`, 20)) {
      return new Response(JSON.stringify({ error: 'Limite atteinte. Réessayez dans une heure.' }), { status: 429, headers: CORS })
    }

    // Détecter si le client parle de rendez-vous
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
    const wantsRdv = /(rendez.vous|rdv|disponib|créneau|créneaux|réserver|prendre rendez|quand puis|appointment)/i.test(lastMessage)

    // Date du jour en français
    const now = new Date()
    const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
    const todayStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

    let system = SYSTEM_BASE + `\n\nDATE ACTUELLE : ${todayStr}`
    if (wantsRdv) {
      const slots = await getAvailableSlots()
      system += `\n\nDISPONIBILITÉS ACTUELLES (7 prochains jours ouvrables) :\n${slots}\n\nSi le client choisit un créneau, invite-le à finaliser sa réservation sur cabinet-gestorh.com/rendez-vous`
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
      max_tokens: 400,
      system,
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
