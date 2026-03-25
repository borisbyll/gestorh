import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { FileText, Calendar, MessageSquare, Star, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { supabase }            from '@/lib/supabase'
import { formatDate }          from '@/lib/utils'

interface Stats {
  contacts:     number
  appointments: number
  reviews:      number
  subscribers:  number
  posts:        number
  tests:        number
}

interface RecentItem {
  id:         string
  title:      string
  subtitle:   string
  time:       string
  type:       'contact' | 'appointment' | 'review'
}

export default function DashboardPage() {
  const [stats,  setStats]  = useState<Stats>({ contacts:0, appointments:0, reviews:0, subscribers:0, posts:0, tests:0 })
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    const load = async () => {
      const [contacts, appointments, reviews, subscribers, posts, tests] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('approved', false),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('confirmed', true),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
        supabase.from('test_results').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        contacts:     contacts.count     || 0,
        appointments: appointments.count || 0,
        reviews:      reviews.count      || 0,
        subscribers:  subscribers.count  || 0,
        posts:        posts.count        || 0,
        tests:        tests.count        || 0,
      })

      // Activité récente
      const [recentContacts, recentRdv, recentReviews] = await Promise.all([
        supabase.from('contacts').select('id,nom,service,created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('appointments').select('id,nom,service,date,created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('reviews').select('id,author_name,service,created_at').eq('approved', false).order('created_at', { ascending: false }).limit(3),
      ])

      const items: RecentItem[] = [
        ...(recentContacts.data || []).map(c => ({ id: c.id, title: c.nom, subtitle: `Message — ${c.service}`, time: c.created_at, type: 'contact' as const })),
        ...(recentRdv.data     || []).map(r => ({ id: r.id, title: r.nom, subtitle: `RDV — ${r.service} le ${r.date}`, time: r.created_at, type: 'appointment' as const })),
        ...(recentReviews.data || []).map(v => ({ id: v.id, title: v.author_name, subtitle: `Avis en attente — ${v.service}`, time: v.created_at, type: 'review' as const })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)

      setRecent(items)
      setLoading(false)
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: 'Messages reçus',    value: stats.contacts,     icon: MessageSquare, color: 'bg-blue-500',   to: '/admin/contacts' },
    { label: 'Rendez-vous',       value: stats.appointments, icon: Calendar,      color: 'bg-purple-500', to: '/admin/rdv' },
    { label: 'Avis en attente',   value: stats.reviews,      icon: Star,          color: 'bg-amber-500',  to: '/admin/avis' },
    { label: 'Abonnés newsletter',value: stats.subscribers,  icon: Users,         color: 'bg-green-500',  to: '/admin/contacts' },
    { label: 'Articles publiés',  value: stats.posts,        icon: FileText,      color: 'bg-navy',       to: '/admin/blog' },
    { label: 'Tests complétés',   value: stats.tests,        icon: TrendingUp,    color: 'bg-pink-500',   to: '/admin' },
  ]

  const TYPE_ICONS = {
    contact:     { icon: MessageSquare, bg: 'bg-blue-100',   text: 'text-blue-600'   },
    appointment: { icon: Calendar,      bg: 'bg-purple-100', text: 'text-purple-600' },
    review:      { icon: Star,          bg: 'bg-amber-100',  text: 'text-amber-600'  },
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenue dans l'espace administration GESTORH</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to}
            className="card p-5 hover:shadow-hover hover:-translate-y-1 transition-all duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon size={18} className="text-white"/>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-navy transition-colors mt-1"/>
            </div>
            {loading
              ? <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mb-1"/>
              : <div className="text-2xl font-black text-gray-900">{value}</div>
            }
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* Activité récente */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-gray-900">Activité récente</h2>
          <Clock size={16} className="text-gray-400"/>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse"/>)}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucune activité récente</p>
        ) : (
          <div className="space-y-3">
            {recent.map(item => {
              const { icon: Icon, bg, text } = TYPE_ICONS[item.type]
              return (
                <div key={item.id} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={15} className={text}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(item.time)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}