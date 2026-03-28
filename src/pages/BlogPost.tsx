import { useState, useEffect }  from 'react'
import { useParams, Link }      from 'react-router-dom'
import { Helmet }               from 'react-helmet-async'
import { ArrowLeft, Clock, Eye, Calendar, Check, Facebook, Linkedin, MessageCircle, Link as LinkIcon, FileText } from 'lucide-react'
import { supabase }             from '@/lib/supabase'
import { formatDate }           from '@/lib/utils'
import NewsletterForm           from '@/components/newsletter/NewsletterForm'
import Reveal                   from '@/components/ui/Reveal'

interface Post {
  id:          string
  title:       string
  slug:        string
  excerpt:     string
  content:     string
  cover_url:   string | null
  category:    string
  read_time:   number
  views:       number
  created_at:  string
  author_name: string
  tags:        string[]
  seo_title?:  string
  seo_desc?:   string
}

const DEMO: Post = {
  id: 'demo', author_name: 'Équipe GESTORH', views: 142, read_time: 5,
  title: '5 signes que votre équipe souffre de burn-out collectif',
  slug:  'signes-burnout-collectif',
  excerpt: 'Le burn-out ne touche pas uniquement les individus.',
  cover_url: null, category: 'RH & Management', created_at: '2026-02-10',
  tags: ['Burn-out', 'Management', 'Bien-être au travail'],
  content: `<h2>Introduction</h2>
<p>Le burn-out collectif est l'un des phénomènes les plus destructeurs pour une organisation.</p>
<h2>1. La productivité chute sans explication</h2>
<p>Lorsque les équipes commencent à livrer moins et à rater des délais, c'est souvent le premier signe d'épuisement profond.</p>
<h2>2. L'absentéisme monte</h2>
<p>Une hausse des congés maladie de courte durée est un signal fort. Les collaborateurs cherchent inconsciemment à recharger leurs batteries.</p>
<h2>3. Les conflits internes se multiplient</h2>
<p>L'irritabilité chronique génère des frictions là où il n'y en avait pas. Les réunions deviennent tendues.</p>
<h2>Que faire ?</h2>
<p>Contactez <strong>GESTORH</strong> pour un audit organisationnel complet et un accompagnement sur mesure.</p>`,
}

export default function BlogPost() {
  const { slug }               = useParams<{ slug: string }>()
  const [post,     setPost]    = useState<Post | null>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading,  setLoading] = useState(true)
  const [copied,   setCopied]  = useState(false)
  const [views,    setViews]   = useState(0)

  useEffect(() => {
    if (!slug) return
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('published', true).single()
      .then(async ({ data }) => {
        const p = data ?? DEMO
        setPost(p)
        setViews(p.views || 0)
        setLoading(false)

        /* Incrémenter les vues */
        if (data) {
          const newViews = (data.views || 0) + 1
          await supabase.from('blog_posts').update({ views: newViews }).eq('id', data.id)
          setViews(newViews)

          /* Articles similaires */
          const { data: rel } = await supabase
            .from('blog_posts')
            .select('id,title,slug,excerpt,cover_url,category,read_time,views,created_at,author_name')
            .eq('published', true)
            .eq('category', data.category)
            .neq('id', data.id)
            .order('views', { ascending: false })
            .limit(3)
          setRelated(rel || [])
        }
      })
  }, [slug])

  /* Partage */
  const url   = window.location.href
  const title = post?.title || 'Article GESTORH'

  const shareLinks = [
    {
      label: 'WhatsApp',
      icon:  MessageCircle,
      color: 'bg-[#25d366] hover:bg-[#1db954]',
      href:  `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    },
    {
      label: 'Facebook',
      icon:  Facebook,
      color: 'bg-[#1877f2] hover:bg-[#0d65d8]',
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: 'LinkedIn',
      icon:  Linkedin,
      color: 'bg-[#0a66c2] hover:bg-[#0958a8]',
      href:  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="wrap py-20 max-w-3xl">
      <div className="h-8 bg-gray-200 rounded-xl w-48 mb-8 animate-pulse"/>
      <div className="h-64 bg-gray-200 rounded-3xl mb-8 animate-pulse"/>
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width:`${70+i*5}%` }}/>)}
      </div>
    </div>
  )

  if (!post) return (
    <div className="wrap py-32 text-center">
      <FileText size={56} className="text-gray-300 mb-6 mx-auto" />
      <h1 className="h2 mb-4">Article introuvable</h1>
      <Link to="/blog" className="btn-navy">Retour au blog</Link>
    </div>
  )

  const metaTitle = post.seo_title || post.title
  const metaDesc  = post.seo_desc  || post.excerpt

  return (
    <>
      <Helmet>
        <title>{metaTitle} | GESTORH Blog</title>
        <meta name="description"         content={metaDesc}/>
        <meta property="og:title"        content={metaTitle}/>
        <meta property="og:description"  content={metaDesc}/>
        <meta property="og:type"         content="article"/>
        <meta property="og:url"          content={url}/>
        {post.cover_url && <meta property="og:image" content={post.cover_url}/>}
        <meta name="twitter:card"        content="summary_large_image"/>
        <meta name="twitter:title"       content={metaTitle}/>
        <meta name="twitter:description" content={metaDesc}/>
        {post.cover_url && <meta name="twitter:image" content={post.cover_url}/>}
        <script type="application/ld+json">{JSON.stringify({
          '@context':    'https://schema.org',
          '@type':       'BlogPosting',
          headline:      post.title,
          description:   post.excerpt,
          author:        { '@type': 'Person', name: post.author_name },
          datePublished: post.created_at,
          image:         post.cover_url || undefined,
          publisher:     { '@type': 'Organization', name: 'GESTORH', url: 'https://gestorh.tg' },
          keywords:      post.tags?.join(', '),
        })}</script>
      </Helmet>

      <div className="wrap py-8 md:py-12 max-w-3xl">

        {/* Retour */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-blue text-sm font-bold mb-8 bg-blue-soft px-4 py-2 rounded-xl hover:bg-blue/20 transition-colors">
          <ArrowLeft size={15}/> Retour au blog
        </Link>

        {/* Header */}
        <header className="mb-8">
          <span className="inline-block text-xs font-extrabold tracking-widest uppercase px-3 py-1.5 rounded-full bg-brand-light text-brand-dark mb-4">
            {post.category}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-5">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 font-medium">
            <span className="font-bold text-gray-700">{post.author_name}</span>
            <span className="flex items-center gap-1.5"><Calendar size={13}/> {formatDate(post.created_at)}</span>
            <span className="flex items-center gap-1.5"><Clock size={13}/> {post.read_time} min</span>
            <span className="flex items-center gap-1.5"><Eye size={13}/> {views} vues</span>
          </div>
        </header>

        {/* Cover */}
        {post.cover_url
          ? <img src={post.cover_url} alt={post.title} className="w-full h-64 md:h-80 object-cover rounded-3xl mb-10 border border-gray-200"/>
          : <div className="w-full h-48 rounded-3xl mb-10 bg-gradient-to-br from-navy to-navy-mid flex items-center justify-center"><FileText size={48} className="text-white/30" /></div>
        }

        {/* Contenu */}
        <div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.content }}/>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-200">
            {post.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">#{tag}</span>
            ))}
          </div>
        )}

        {/* ── Partage ── */}
        <div className="mt-10 p-6 bg-gray-50 rounded-3xl border border-gray-200">
          <p className="text-sm font-black text-gray-900 mb-4">Partager cet article</p>
          <div className="flex flex-wrap gap-3">
            {shareLinks.map(({ label, icon: Icon, color, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5 ${color}`}>
                <Icon size={16}/> {label}
              </a>
            ))}
            <button onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-gray-200 hover:border-navy text-gray-700 text-sm font-bold transition-all hover:-translate-y-0.5">
              {copied ? <><Check size={16} className="text-green-600"/> Copié !</> : <><LinkIcon size={16}/> Copier le lien</>}
            </button>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-8 bg-navy rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-blue/20 blur-3xl pointer-events-none"/>
          <p className="text-brand text-xs font-extrabold tracking-widest uppercase mb-2 relative">GESTORH</p>
          <h3 className="text-xl font-black text-white mb-3 relative">Besoin d'un accompagnement ?</h3>
          <p className="text-white/50 text-sm mb-6 relative">Nos experts sont disponibles pour vous aider.</p>
          <Link to="/rendez-vous" className="btn-orange relative">Prendre rendez-vous</Link>
        </div>

        {/* ── Newsletter ── */}
        <div className="mt-8 card p-8">
          <h3 className="font-black text-lg mb-2">Ne ratez pas nos prochains articles</h3>
          <p className="text-gray-500 text-sm mb-5">Conseils gratuits chaque semaine dans votre boîte mail.</p>
          <NewsletterForm/>
        </div>

        {/* ── Articles similaires ── */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-black text-gray-900 mb-6">Articles similaires</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r, i) => (
                <Reveal key={r.id} delay={i * .08}>
                  <Link to={`/blog/${r.slug}`}
                    className="card-hover group block overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-navy to-navy-mid relative overflow-hidden">
                      {r.cover_url
                        ? <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                        : <div className="w-full h-full flex items-center justify-center"><FileText size={28} className="text-white/30" /></div>
                      }
                    </div>
                    <div className="p-4">
                      <span className="text-[.6rem] font-extrabold tracking-widest uppercase text-brand-dark">{r.category}</span>
                      <h4 className="text-sm font-black text-gray-900 mt-1 leading-snug line-clamp-2 group-hover:text-navy transition-colors">
                        {r.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Clock size={10}/> {r.read_time} min
                        <span>·</span>
                        <Eye size={10}/> {r.views}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}