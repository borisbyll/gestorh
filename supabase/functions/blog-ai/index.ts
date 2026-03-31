import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
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
