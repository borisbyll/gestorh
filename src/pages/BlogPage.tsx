import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { Helmet }              from 'react-helmet-async'
import { Clock, Eye, Search, FileText }  from 'lucide-react'
import { supabase }            from '@/lib/supabase'
import { formatDate }          from '@/lib/utils'
import Reveal                  from '@/components/ui/Reveal'

interface Post {
  id:          string
  title:       string
  slug:        string
  excerpt:     string
  cover_url:   string | null
  category:    string
  read_time:   number
  views:       number
  created_at:  string
  author_name: string
}

const CATS = ['Tous', 'RH & Management', 'Psychologie', 'Coaching', 'Bien-être', 'Couple & Famille']

const DEMO: Post[] = [
  { id: '1', author_name: 'Équipe GESTORH', views: 142, read_time: 5, created_at: '2026-02-10', cover_url: null, category: 'RH & Management', title: '5 signes que votre équipe souffre de burn-out collectif', slug: 'signes-burnout-collectif', excerpt: 'Le burn-out ne touche pas uniquement les individus. Découvrez les signaux organisationnels et comment y remédier avant la rupture.' },
  { id: '2', author_name: 'Dr. A. Mensah',  views: 98,  read_time: 7, created_at: '2026-02-03', cover_url: null, category: 'Psychologie',     title: 'Comment développer une intelligence émotionnelle de haut niveau', slug: 'intelligence-emotionnelle', excerpt: "L'intelligence émotionnelle est le facteur n°1 de réussite professionnelle. Voici les 4 piliers à travailler dès maintenant." },
  { id: '3', author_name: 'Équipe GESTORH', views: 210, read_time: 4, created_at: '2026-01-20', cover_url: null, category: 'Coaching',         title: 'Leadership au Togo : adapter son style à la culture locale', slug: 'leadership-culture-togo', excerpt: 'Le management importé d\'Occident ne fonctionne pas toujours en Afrique. Décryptage des clés d\'un leadership ancré dans nos réalités.' },
  { id: '4', author_name: 'Dr. A. Mensah',  views: 76,  read_time: 6, created_at: '2026-01-12', cover_url: null, category: 'Couple & Famille', title: 'Thérapie de couple : 3 exercices à pratiquer chez soi', slug: 'exercices-therapie-couple', excerpt: 'Trois exercices simples issus de la thérapie Gottman pour renforcer votre lien.' },
  { id: '5', author_name: 'Équipe GESTORH', views: 187, read_time: 8, created_at: '2025-12-28', cover_url: null, category: 'RH & Management', title: 'Digitalisation RH en Afrique : opportunités et pièges à éviter', slug: 'digitalisation-rh-afrique', excerpt: 'Les SIRH et outils RH digitaux transforment les entreprises africaines. Guide pratique pour réussir votre transition.' },
  { id: '6', author_name: 'Équipe GESTORH', views: 54,  read_time: 5, created_at: '2025-12-15', cover_url: null, category: 'Bien-être',        title: 'Ikigai au travail : trouver sa raison d\'être professionnelle', slug: 'ikigai-travail', excerpt: 'Le concept japonais de l\'ikigai peut transformer votre rapport au travail. Comment l\'appliquer dans le contexte africain ?' },
]

const CAT_COLORS: Record<string, string> = {
  'RH & Management':  'bg-blue-100 text-blue-700',
  'Psychologie':      'bg-purple-100 text-purple-700',
  'Coaching':         'bg-amber-100 text-amber-700',
  'Bien-être':        'bg-green-100 text-green-700',
  'Couple & Famille': 'bg-pink-100 text-pink-700',
}

function PostCard({ post }: { post: Post }) {
  const color = CAT_COLORS[post.category] || 'bg-gray-100 text-gray-700'
  return (
    <article className="card-hover flex flex-col h-full overflow-hidden group">
      <div className="h-40 md:h-48 bg-gradient-to-br from-navy to-navy-mid relative overflow-hidden flex-shrink-0">
        {post.cover_url
          ? <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
          : <div className="w-full h-full flex items-center justify-center"><FileText size={40} className="text-white/20"/></div>
        }
        <span className={`absolute top-3 left-3 text-[.65rem] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${color}`}>
          {post.category}
        </span>
      </div>
      <div className="p-4 md:p-6 flex flex-col flex-1">
        <h2 className="font-black text-gray-900 text-base leading-snug mb-3 group-hover:text-navy transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5 line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1"><Clock size={11}/> {post.read_time} min</span>
            <span className="flex items-center gap-1"><Eye size={11}/> {post.views}</span>
          </div>
          <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
        </div>
      </div>
    </article>
  )
}

export default function BlogPage() {
  const [posts,   setPosts]   = useState<Post[]>([])
  const [cat,     setCat]     = useState('Tous')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,cover_url,category,read_time,views,created_at,author_name')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data && data.length > 0 ? data : DEMO)
        setLoading(false)
      })
  }, [])

  const filtered = posts.filter(p => {
    const matchCat    = cat === 'Tous' || p.category === cat
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.excerpt.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      <Helmet>
        <title>Blog RH & Bien-être | GESTORH</title>
        <meta name="description" content="Conseils experts en RH, psychologie, coaching et bien-être au travail."/>
      </Helmet>

      <div className="bg-gradient-to-br from-navy-deep to-navy-mid py-12 md:py-20 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue/20 blur-3xl"/>
        </div>
        <div className="relative z-10">
          <span className="badge mb-4">Ressources gratuites</span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">Blog <span className="text-gradient">RH & Bien-être</span></h1>
          <p className="text-white/55 text-sm md:text-base max-w-lg mx-auto">Conseils pratiques rédigés par nos experts.</p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
        <div className="wrap py-3 flex flex-col gap-3">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…" className="input !py-2.5 !pl-9 !text-sm w-full"/>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  cat === c ? 'bg-navy text-white' : 'text-gray-500 hover:text-navy hover:bg-blue-soft'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap py-8 md:py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[1,2,3].map(i => <div key={i} className="card h-64 md:h-80 animate-pulse bg-gray-100"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Search size={40} className="text-gray-300 mx-auto mb-4"/>
            <p className="font-bold text-lg">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filtered.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.07}>
                <Link to={`/blog/${post.slug}`} className="block h-full">
                  <PostCard post={post}/>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  )
}