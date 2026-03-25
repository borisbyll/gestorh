import { useState, useEffect } from 'react'
import { Star, Check, Trash2, Eye } from 'lucide-react'
import { supabase }   from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast          from 'react-hot-toast'

interface Review {
  id:          string
  created_at:  string
  author_name: string
  author_role: string
  content:     string
  rating:      number
  approved:    boolean
  service:     string
}

export default function AvisAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('pending')

  const load = async () => {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approve = async (id: string) => {
    const { error } = await supabase.from('reviews').update({ approved: true }).eq('id', id)
    if (error) { toast.error('Erreur'); return }
    toast.success('Avis approuvé et publié !')
    load()
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Supprimer cet avis définitivement ?')) return
    await supabase.from('reviews').delete().eq('id', id)
    toast.success('Avis supprimé')
    load()
  }

  const filtered = reviews.filter(r =>
    filter === 'Tous' ? true :
    filter === 'pending' ? !r.approved :
    r.approved
  )

  const FILTERS = [
    { key: 'pending',  label: 'En attente', count: reviews.filter(r => !r.approved).length },
    { key: 'approved', label: 'Approuvés',  count: reviews.filter(r => r.approved).length  },
    { key: 'Tous',     label: 'Tous',       count: reviews.length },
  ]

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Avis clients</h1>
        <p className="text-gray-500 text-sm">
          {reviews.filter(r => !r.approved).length} avis en attente de modération
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f.key ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-navy hover:text-navy'
            }`}>
            {f.label} <span className="ml-1 opacity-60">({f.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">⭐</p>
          <p className="font-bold text-gray-700">Aucun avis {filter === 'pending' ? 'en attente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => (
            <div key={review.id} className={`card p-6 ${!review.approved ? 'border-l-4 border-l-amber-400' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={16} className={n <= review.rating ? 'text-brand fill-brand' : 'text-gray-200 fill-gray-100'}/>
                    ))}
                    <span className="ml-2 text-xs font-bold text-gray-400">{review.rating}/5</span>
                  </div>

                  {/* Content */}
                  <blockquote className="text-gray-700 text-sm leading-relaxed italic border-l-3 border-brand pl-3 mb-4">
                    "{review.content}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <p className="text-sm font-black text-gray-900">{review.author_name}</p>
                      <p className="text-xs text-blue font-semibold">{review.author_role}</p>
                    </div>
                    {review.service && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold">
                        {review.service}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${review.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {review.approved ? '✓ Publié' : '⏳ En attente'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!review.approved && (
                    <button onClick={() => approve(review.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors">
                      <Check size={13}/> Approuver
                    </button>
                  )}
                  {review.approved && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-100 text-green-700 text-xs font-bold">
                      <Eye size={13}/> Publié
                    </div>
                  )}
                  <button onClick={() => deleteReview(review.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors">
                    <Trash2 size={13}/> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}