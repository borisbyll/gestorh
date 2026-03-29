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
    // 1. Vérifier JWT Supabase (admin uniquement)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: CORS })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), { status: 401, headers: CORS })
    }

    // 2. Lire le payload
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Prompt requis' }), { status: 400, headers: CORS })
    }

    // 3. Appeler Claude
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
