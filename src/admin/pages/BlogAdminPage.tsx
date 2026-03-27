import { useState, useEffect, useRef } from 'react'
import { motion }          from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, Clock, Image, Sparkles, Loader2, ChevronDown, FileText } from 'lucide-react'
import { supabase }        from '@/lib/supabase'
import { formatDate }      from '@/lib/utils'
import RichEditor          from '@/admin/components/RichEditor'
import toast               from 'react-hot-toast'

interface Post {
  id:           string
  title:        string
  slug:         string
  excerpt:      string
  content:      string
  category:     string
  tags:         string[]
  published:    boolean
  author_name:  string
  read_time:    number
  views:        number
  cover_url:    string | null
  created_at:   string
  seo_title?:   string
  seo_desc?:    string
  seo_keyword?: string
}

const CATS = ['RH & Management','Psychologie','Coaching','Bien-être','Couple & Famille']

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

const EMPTY: Post = {
  id:'', title:'', slug:'', excerpt:'', content:'', category:'RH & Management',
  tags:[], published:false, author_name:'Équipe GESTORH', read_time:5,
  views:0, cover_url:null, created_at:'', seo_title:'', seo_desc:'', seo_keyword:''
}

/* ── Appel IA via Edge Function sécurisée ── */
async function callClaude(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('blog-ai', {
    body: { prompt },
  })
  if (error) throw new Error(error.message || 'Erreur IA')
  return data?.content || ''
}

export default function BlogAdminPage() {
  const [posts,     setPosts]     = useState<Post[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState<Post | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [tab,       setTab]       = useState<'content'|'seo'>('content')

  /* IA */
  const [aiOpen,    setAiOpen]    = useState(false)
  const [aiPrompt,  setAiPrompt]  = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAction,  setAiAction]  = useState<'generate'|'improve'|'seo'|'excerpt'>('generate')

  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing({ ...EMPTY })
    setTagsInput('')
    setPreview(null)
    setTab('content')
    setAiOpen(false)
  }

  const openEdit = (post: Post) => {
    setEditing({ ...post })
    setTagsInput(post.tags?.join(', ') || '')
    setPreview(post.cover_url || null)
    setTab('content')
    setAiOpen(false)
  }

  /* ── Upload couverture ── */
  const uploadCover = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Image requise'); return }
    if (file.size > 5 * 1024 * 1024)    { toast.error('Max 5MB'); return }
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const name = `cover-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('blog-images').upload(name, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('blog-images').getPublicUrl(name)
      setEditing(e => e ? { ...e, cover_url: data.publicUrl } : e)
      setPreview(data.publicUrl)
      toast.success('Image uploadée !')
    } catch (e: any) {
      toast.error(e.message || 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  const removeCover = async () => {
    if (!editing?.cover_url) return
    const name = editing.cover_url.split('/').pop()
    if (name) await supabase.storage.from('blog-images').remove([name])
    setEditing(e => e ? { ...e, cover_url: null } : e)
    setPreview(null)
  }

  /* ── Assistant IA ── */
  const runAI = async () => {
    if (!editing) return
    if (aiAction === 'generate' && !aiPrompt.trim()) { toast.error('Décrivez le sujet'); return }
    setAiLoading(true)

    try {
      let prompt = ''
      const context = `Tu es un expert en RH, psychologie et coaching pour le cabinet GESTORH à Lomé, Togo. Tu rédiges en français professionnel et bienveillant.`

      if (aiAction === 'generate') {
        prompt = `${context}

Génère un article de blog complet et professionnel sur ce sujet : "${aiPrompt}"
Catégorie : ${editing.category}

Format HTML avec ces balises uniquement : <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote>
L'article doit :
- Avoir une introduction engageante
- Contenir 4 à 6 sections avec des titres H2
- Inclure des exemples concrets adaptés au contexte africain/togolais
- Se terminer par un appel à l'action vers GESTORH
- Faire entre 600 et 900 mots
- Ne pas inclure de balises html, head, body`

      } else if (aiAction === 'improve') {
        if (!editing.content) { toast.error('Aucun contenu à améliorer'); setAiLoading(false); return }
        prompt = `${context}

Améliore ce texte de blog en le rendant plus engageant, professionnel et adapté au contexte africain. Garde le même format HTML.

Texte actuel :
${editing.content.slice(0, 3000)}

Retourne uniquement le HTML amélioré sans commentaires.`

      } else if (aiAction === 'seo') {
        const titleOrContent = editing.title || editing.content?.slice(0, 500) || aiPrompt
        prompt = `${context}

Sur la base de ce contenu/sujet : "${titleOrContent}"
Catégorie : ${editing.category}

Génère en JSON uniquement (sans markdown, sans backticks) :
{
  "seo_title": "titre SEO optimisé max 60 caractères",
  "seo_desc": "meta description entre 120 et 160 caractères",
  "seo_keyword": "mot-clé principal",
  "title": "titre d'article accrocheur",
  "tags": ["tag1", "tag2", "tag3"]
}`

      } else if (aiAction === 'excerpt') {
        if (!editing.content) { toast.error('Aucun contenu à résumer'); setAiLoading(false); return }
        prompt = `${context}

Génère un résumé accrocheur de 120 à 160 caractères pour cet article de blog. Ce résumé sera affiché dans la liste des articles et utilisé comme meta description.

Contenu de l'article :
${editing.content.slice(0, 2000)}

Retourne uniquement le résumé, sans guillemets ni ponctuation finale.`
      }

      const result = await callClaude(prompt)

      if (aiAction === 'generate' || aiAction === 'improve') {
        setEditing(e => e ? { ...e, content: result } : e)
        toast.success('Contenu généré !')

      } else if (aiAction === 'seo') {
        try {
          const json = JSON.parse(result.trim())
          setEditing(e => e ? {
            ...e,
            seo_title:   json.seo_title   || e.seo_title,
            seo_desc:    json.seo_desc    || e.seo_desc,
            seo_keyword: json.seo_keyword || e.seo_keyword,
            title:       json.title       || e.title,
            slug:        slugify(json.title || e.title),
            tags:        json.tags        || e.tags,
          } : e)
          if (json.tags) setTagsInput(json.tags.join(', '))
          setTab('seo')
          toast.success('Métadonnées SEO générées !')
        } catch {
          toast.error('Erreur parsing JSON — réessayez')
        }

      } else if (aiAction === 'excerpt') {
        setEditing(e => e ? { ...e, excerpt: result.trim() } : e)
        toast.success('Résumé généré !')
      }

      setAiOpen(false)
      setAiPrompt('')

    } catch (e: any) {
      toast.error(e.message || 'Erreur IA')
    } finally {
      setAiLoading(false)
    }
  }

  /* ── Sauvegarde ── */
  const save = async (publish?: boolean) => {
    if (!editing) return
    if (!editing.title || !editing.excerpt || !editing.content) {
      toast.error('Titre, résumé et contenu sont obligatoires')
      return
    }
    setSaving(true)
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      const slug = editing.slug || slugify(editing.title)
      const payload = { ...editing, slug, tags, published: publish ?? editing.published }

      if (editing.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { id: _, created_at: __, ...rest } = payload
        const { error } = await supabase.from('blog_posts').insert(rest)
        if (error) throw error
      }
      toast.success(publish ? 'Article publié !' : 'Brouillon sauvegardé !')
      setEditing(null)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  /* ── SEO Score ── */
  function seoScore(p: Post) {
    let score = 0
    if (p.title && p.title.length >= 30 && p.title.length <= 60) score += 25
    if (p.seo_desc && p.seo_desc.length >= 120 && p.seo_desc.length <= 160) score += 25
    if (p.seo_keyword && p.content?.includes(p.seo_keyword)) score += 25
    if (p.cover_url) score += 15
    if (p.tags && p.tags.length > 0) score += 10
    if (score >= 75) return { score, color: 'text-green-600', bar: 'bg-green-500', label: 'Bon' }
    if (score >= 40) return { score, color: 'text-amber-600', bar: 'bg-amber-500', label: 'Moyen' }
    return { score, color: 'text-red-500', bar: 'bg-red-500', label: 'Faible' }
  }

  const togglePublish = async (post: Post) => {
    await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id)
    toast.success(post.published ? 'Dépublié' : 'Publié !')
    load()
  }

  const deletePost = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    toast.success('Supprimé')
    load()
  }

  /* ══ ÉDITEUR ══ */
  if (editing !== null) {
    const seo = seoScore(editing)
    return (
      <div className="p-6 md:p-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">
              {editing.id ? 'Modifier l\'article' : 'Nouvel article'}
            </h1>
            <div className={`text-xs font-bold mt-0.5 ${seo.color}`}>
              SEO : {seo.label} ({seo.score}/100)
            </div>
          </div>
          <button onClick={() => setEditing(null)} className="btn-outline"><X size={14}/> Fermer</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(['content','seo'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab===t ? 'bg-white shadow-sm text-navy' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'content' ? '✏️ Contenu' : '🔍 SEO'}
            </button>
          ))}
        </div>

        <div className="card p-6 space-y-5">

          {/* ══ ONGLET CONTENU ══ */}
          {tab === 'content' && <>

            {/* Image couverture */}
            <div>
              <label className="label">Image de couverture</label>
              {preview ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
                  <img src={preview} alt="Couverture" className="w-full h-52 object-cover"/>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-bold hover:bg-gray-100">Changer</button>
                    <button onClick={removeCover} className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-xl text-sm font-bold text-white hover:bg-red-700">Supprimer</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full h-40 rounded-2xl border-2 border-dashed border-gray-300 hover:border-navy hover:bg-blue-soft transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-navy disabled:opacity-50">
                  {uploading
                    ? <span className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
                    : <><Image size={28} className="opacity-40"/><span className="text-sm font-semibold">Ajouter une image de couverture</span><span className="text-xs">JPG, PNG, WebP · max 5MB</span></>
                  }
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f) }}/>
            </div>

            {/* Titre */}
            <div>
              <label className="label">Titre *
                <span className={`ml-2 font-normal normal-case tracking-normal ${editing.title.length > 60 ? 'text-red-500' : editing.title.length >= 30 ? 'text-green-600' : 'text-gray-400'}`}>
                  ({editing.title.length}/60)
                </span>
              </label>
              <input value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value, slug: slugify(e.target.value) })}
                className="input" placeholder="Titre accrocheur entre 30 et 60 caractères"/>
            </div>

            {/* Catégorie & Auteur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Catégorie</label>
                <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="input">
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Auteur</label>
                <input value={editing.author_name} onChange={e => setEditing({ ...editing, author_name: e.target.value })} className="input"/>
              </div>
            </div>

            {/* Tags & Temps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Tags (séparés par des virgules)</label>
                <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="input" placeholder="RH, Management, Leadership"/>
              </div>
              <div>
                <label className="label">Temps de lecture (min)</label>
                <input type="number" value={editing.read_time} onChange={e => setEditing({ ...editing, read_time: +e.target.value })} className="input"/>
              </div>
            </div>

            {/* Résumé */}
            <div>
              <label className="label">Résumé *
                <span className={`ml-2 font-normal normal-case tracking-normal ${editing.excerpt.length > 160 ? 'text-red-500' : editing.excerpt.length >= 120 ? 'text-green-600' : 'text-gray-400'}`}>
                  ({editing.excerpt.length}/160)
                </span>
              </label>
              <textarea value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
                rows={2} className="input resize-none" placeholder="Résumé entre 120 et 160 caractères"/>
            </div>

            {/* ── Assistant IA ── */}
            <div className="border-2 border-dashed border-brand/40 rounded-2xl overflow-hidden">
              <button onClick={() => setAiOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-brand-light hover:bg-brand/10 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-brand-dark"/>
                  <span className="text-sm font-black text-brand-dark">Assistant IA — Rédaction & SEO</span>
                </div>
                <ChevronDown size={16} className={`text-brand-dark transition-transform ${aiOpen ? 'rotate-180' : ''}`}/>
              </button>

              {aiOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                  <div className="p-5 space-y-4 bg-white">

                    {/* Actions IA */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'generate', label: '✨ Générer un article',    desc: 'À partir d\'un sujet' },
                        { key: 'improve',  label: '✍️ Améliorer le texte',    desc: 'Rendre plus engageant' },
                        { key: 'seo',      label: '🔍 Optimiser le SEO',      desc: 'Titre, meta, mots-clés' },
                        { key: 'excerpt',  label: '📝 Générer le résumé',     desc: 'À partir du contenu' },
                      ].map(a => (
                        <button key={a.key} onClick={() => setAiAction(a.key as any)}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all ${aiAction === a.key ? 'border-brand bg-brand-light' : 'border-gray-200 hover:border-brand/50'}`}>
                          <div className="text-sm font-bold text-gray-900">{a.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Prompt (uniquement pour generate et seo sans contenu) */}
                    {(aiAction === 'generate' || (aiAction === 'seo' && !editing.title && !editing.content)) && (
                      <div>
                        <label className="label">
                          {aiAction === 'generate' ? 'Sujet de l\'article' : 'Sujet ou mots-clés'}
                        </label>
                        <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                          className="input" placeholder={aiAction === 'generate'
                            ? 'Ex: Comment prévenir le burn-out dans les PME au Togo'
                            : 'Ex: coaching leadership Lomé'}
                          onKeyDown={e => { if (e.key === 'Enter') runAI() }}/>
                      </div>
                    )}

                    <button onClick={runAI} disabled={aiLoading}
                      className="btn-orange w-full justify-center">
                      {aiLoading
                        ? <><Loader2 size={15} className="animate-spin"/> Génération en cours…</>
                        : <><Sparkles size={15}/> Lancer l'IA</>
                      }
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      ⚠️ Nécessite des crédits Anthropic actifs. Relisez toujours le contenu généré avant de publier.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Éditeur riche */}
            <div>
              <label className="label">Contenu *</label>
              <RichEditor value={editing.content} onChange={v => setEditing({ ...editing, content: v })}/>
            </div>
          </>}

          {/* ══ ONGLET SEO ══ */}
          {tab === 'seo' && <>
            <div className={`p-5 rounded-2xl border-2 ${seo.score >= 75 ? 'border-green-300 bg-green-50' : seo.score >= 40 ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-black ${seo.color}`}>Score SEO : {seo.label}</span>
                <span className={`text-2xl font-black ${seo.color}`}>{seo.score}/100</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${seo.bar}`} style={{ width: `${seo.score}%` }}/>
              </div>
              <ul className="mt-3 space-y-1 text-xs">
                {[
                  { ok: editing.title.length >= 30 && editing.title.length <= 60, label: 'Titre entre 30 et 60 caractères' },
                  { ok: !!(editing.seo_desc && editing.seo_desc.length >= 120 && editing.seo_desc.length <= 160), label: 'Meta description entre 120 et 160 caractères' },
                  { ok: !!(editing.seo_keyword && editing.content?.includes(editing.seo_keyword)), label: 'Mot-clé présent dans le contenu' },
                  { ok: !!editing.cover_url, label: 'Image de couverture présente' },
                  { ok: !!(editing.tags && editing.tags.length > 0), label: 'Tags renseignés' },
                ].map(({ ok, label }) => (
                  <li key={label} className={ok ? 'text-green-600' : 'text-gray-400'}>
                    {ok ? '✓' : '○'} {label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="label">Titre SEO <span className={`font-normal normal-case tracking-normal ${(editing.seo_title||editing.title).length > 60 ? 'text-red-500' : 'text-gray-400'}`}>({(editing.seo_title||editing.title).length}/60)</span></label>
              <input value={editing.seo_title||''} onChange={e => setEditing({...editing, seo_title:e.target.value})} className="input" placeholder={editing.title||'Titre Google (60 car. max)'}/>
              <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser le titre de l'article</p>
            </div>

            <div>
              <label className="label">Meta description <span className={`font-normal normal-case tracking-normal ${(editing.seo_desc||'').length > 160 ? 'text-red-500' : (editing.seo_desc||'').length >= 120 ? 'text-green-600' : 'text-gray-400'}`}>({(editing.seo_desc||'').length}/160)</span></label>
              <textarea value={editing.seo_desc||''} onChange={e => setEditing({...editing, seo_desc:e.target.value})} rows={3} className="input resize-none" placeholder="Description dans Google (120-160 caractères)"/>
            </div>

            <div>
              <label className="label">Mot-clé principal</label>
              <input value={editing.seo_keyword||''} onChange={e => setEditing({...editing, seo_keyword:e.target.value})} className="input" placeholder="Ex: burn-out au travail, coaching Lomé"/>
            </div>

            <div>
              <label className="label">URL de l'article</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">/blog/</span>
                <input value={editing.slug} onChange={e => setEditing({...editing, slug:e.target.value})} className="input flex-1"/>
              </div>
            </div>

            <div>
              <label className="label">Aperçu dans Google</label>
              <div className="border border-gray-200 rounded-2xl p-5 bg-white">
                <p className="text-blue-600 text-base font-medium truncate">{editing.seo_title||editing.title||'Titre de votre article'}</p>
                <p className="text-green-700 text-xs mt-0.5">gestorh.tg/blog/{editing.slug||'url-article'}</p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{editing.seo_desc||editing.excerpt||'La meta description apparaîtra ici.'}</p>
              </div>
            </div>
          </>}

          {/* ══ BOUTONS EN BAS ══ */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => save(false)} disabled={saving}
              className="btn-outline flex-1 justify-center">
              {saving ? <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin"/> : <Save size={15}/>}
              Sauvegarder en brouillon
            </button>
            <button onClick={() => save(true)} disabled={saving}
              className="btn-navy flex-1 justify-center">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Eye size={15}/>}
              Publier l'article
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ══ LISTE ══ */
  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Blog</h1>
          <p className="text-gray-500 text-sm">{posts.length} article{posts.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-navy"><Plus size={15}/> Nouvel article</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
      ) : posts.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={36} className="text-gray-300 mb-4 mx-auto" />
          <h3 className="font-black text-lg mb-2">Aucun article</h3>
          <p className="text-gray-500 text-sm mb-6">Créez votre premier article</p>
          <button onClick={openNew} className="btn-navy mx-auto"><Plus size={15}/> Créer un article</button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const seo = seoScore(post)
            return (
              <motion.div key={post.id} layout className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {post.cover_url
                  ? <img src={post.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"/>
                  : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><Image size={20} className="text-gray-300"/></div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${post.published ? 'bg-green-500' : 'bg-gray-300'}`}/>
                    <h3 className="font-bold text-gray-900 text-sm truncate">{post.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{post.category}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={10}/> {post.read_time} min</span>
                    <span>·</span>
                    <span>{formatDate(post.created_at)}</span>
                    <span>·</span>
                    <span className={`font-bold ${seo.color}`}>SEO {seo.score}/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(post)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${post.published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {post.published ? <><Eye size={12}/> Publié</> : <><EyeOff size={12}/> Brouillon</>}
                  </button>
                  <button onClick={() => openEdit(post)} className="p-2 rounded-lg hover:bg-blue-soft text-blue transition-colors"><Edit size={15}/></button>
                  <button onClick={() => deletePost(post.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={15}/></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}