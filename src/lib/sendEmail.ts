import { supabase } from '@/lib/supabase'

interface EmailPayload {
  type: string
  to:   string
  data?: Record<string, string>
}

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    // Utilisateur connecté → email-proxy sécurisé (JWT)
    const { error } = await supabase.functions.invoke('email-proxy', {
      body: JSON.stringify(payload),
    })
    if (error) throw error
  } else {
    // Utilisateur non connecté → email-proxy-public (rate limit IP)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/email-proxy-public`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
      throw new Error(err.error || 'Erreur envoi email')
    }
  }
}