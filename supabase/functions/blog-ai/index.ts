import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    // Vérifier que l'appelant est authentifié (admin)
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: CORS })
    }

    // Valider le token avec la service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 401, headers: CORS })
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: CORS })
    }

    // Traiter la requête
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Prompt requis' }), { status: 400, headers: CORS })
    }

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
    const res = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt.slice(0, 6000) }],
    })

    const content = res.content[0]?.type === 'text' ? res.content[0].text : ''
    return new Response(JSON.stringify({ content }), { headers: CORS })

  } catch (err) {
    console.error('[blog-ai]', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500, headers: CORS })
  }
})
