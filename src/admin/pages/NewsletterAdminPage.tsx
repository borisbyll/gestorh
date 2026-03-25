import { useState, useEffect } from 'react'
import {
  Mail, Trash2, Users, Send,
  Clock, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { supabase }   from '@/lib/supabase'
import { sendEmail }  from '@/lib/sendEmail'
import { formatDate } from '@/lib/utils'
import toast          from 'react-hot-toast'

interface Subscriber {
  id:         string
  created_at: string
  email:      string
  confirmed:  boolean
}

interface Campaign {
  id:         string
  created_at: string
  subject:    string
  content:    string
  sent_count: number
  status:     string
  sent_at:    string
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [campaigns,   setCampaigns]   = useState<Campaign[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('Tous')
  const [sending,     setSending]     = useState(false)
  const [subject,     setSubject]     = useState('')
  const [content,     setContent]     = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState<'abonnes' | 'campagnes'>('abonnes')

  const load = async () => {
    const [subRes, campRes] = await Promise.all([
      supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }),
      supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }),
    ])
    setSubscribers(subRes.data || [])
    setCampaigns(campRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Supprimer cet abonné ?')) return
    await supabase.from('newsletter_subscribers').delete().eq('id', id)
    toast.success('Abonné supprimé')
    load()
  }

  const sendNewsletter = async () => {
    if (!subject.trim() || !content.trim()) { toast.error('Sujet et contenu requis'); return }
    const confirmed = subscribers.filter(s => s.confirmed)
    if (confirmed.length === 0) { toast.error('Aucun abonné confirmé'); return }
    if (!confirm(`Envoyer à ${confirmed.length} abonné(s) confirmé(s) ?`)) return

    setSending(true)
    let sent = 0
    let failed = 0

    try {
      for (const sub of confirmed) {
        try {
          await sendEmail({
            type: 'newsletter_custom',
            to:   sub.email,
            data: { subject, content },
          })
          sent++
        } catch {
          failed++
        }
      }

      await supabase.from('newsletter_campaigns').insert({
        subject,
        content,
        sent_count: sent,
        status:     failed === confirmed.length ? 'failed' : 'sent',
        sent_at:    new Date().toISOString(),
      })

      toast.success(`${sent} email(s) envoyé(s) !${failed > 0 ? ` (${failed} échec(s))` : ''}`)
      setShowCompose(false)
      setSubject('')
      setContent('')
      load()
    } catch {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Supprimer cet historique ?')) return
    await supabase.from('newsletter_campaigns').delete().eq('id', id)
    toast.success('Supprimé')
    load()
  }

  const confirmedCount = subscribers.filter(s => s.confirmed).length
  const pendingCount   = subscribers.filter(s => !s.confirmed).length

  const filtered = subscribers.filter(s =>
    filter === 'Tous'       ? true :
    filter === 'Confirmés'  ? s.confirmed :
    !s.confirmed
  )

  const FILTERS = [
    { key: 'Tous',       count: subscribers.length },
    { key: 'Confirmés',  count: confirmedCount      },
    { key: 'En attente', count: pendingCount         },
  ]

  const STATS = [
    { label: 'Total abonnés', value: subscribers.length, icon: Users,       color: 'bg-blue-500'   },
    { label: 'Confirmés',     value: confirmedCount,      icon: CheckCircle, color: 'bg-green-500'  },
    { label: 'En attente',    value: pendingCount,         icon: Clock,       color: 'bg-amber-500'  },
    { label: 'Campagnes',     value: campaigns.length,    icon: Send,        color: 'bg-purple-500' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-5xl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Newsletter</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {confirmedCount} abonné(s) confirmé(s) · {campaigns.length} campagne(s) envoyée(s)
          </p>
        </div>
        <button onClick={() => setShowCompose(v => !v)} className="btn-navy">
          <Send size={15}/> Nouvelle newsletter
        </button>
      </div>

      {showCompose && (
        <div className="card p-6 mb-6 border-2 border-brand/30">
          <h2 className="font-black text-lg mb-5 flex items-center gap-2">
            <Send size={18} className="text-brand"/> Rédiger une newsletter
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Sujet *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                className="input" placeholder="Objet de votre newsletter"/>
            </div>
            <div>
              <label className="label">Contenu *</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                rows={10} className="input resize-none"
                placeholder="Rédigez votre newsletter ici..."/>
              <p className="text-xs text-gray-400 mt-1">{content.length} caractères</p>
            </div>
            {content && (
              <div>
                <label className="label">Aperçu du contenu</label>
                <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Envoi à <strong className="text-navy">{confirmedCount}</strong> abonné(s) confirmé(s)
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCompose(false)} className="btn-outline">Annuler</button>
                <button onClick={sendNewsletter} disabled={sending} className="btn-navy">
                  {sending
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Envoi...</>
                    : <><Send size={15}/> Envoyer</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={16} className="text-white"/>
            </div>
            <div className="text-2xl font-black text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'abonnes',   label: `👥 Abonnés (${subscribers.length})` },
          { key: 'campagnes', label: `📨 Campagnes (${campaigns.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === t.key ? 'bg-white shadow-sm text-navy' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'abonnes' && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === f.key ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-navy hover:text-navy'
                }`}>
                {f.key} <span className="ml-1 opacity-60">({f.count})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">📧</p>
              <p className="font-bold text-gray-700">Aucun abonné</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(sub => (
                <div key={sub.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-soft flex items-center justify-center text-navy font-black text-sm flex-shrink-0">
                      {sub.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{sub.email}</p>
                      <p className="text-xs text-gray-400">{formatDate(sub.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sub.confirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sub.confirmed ? '✓ Confirmé' : '⏳ En attente'}
                    </span>
                    <button onClick={() => deleteSubscriber(sub.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'campagnes' && (
        <>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
          ) : campaigns.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">📨</p>
              <p className="font-bold text-gray-700">Aucune campagne envoyée</p>
              <p className="text-gray-400 text-sm mt-1">Composez votre première newsletter ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(camp => (
                <div key={camp.id} className="card overflow-hidden">
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[.65rem] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${camp.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {camp.status === 'sent' ? '✓ Envoyée' : '✗ Échec'}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(camp.sent_at)}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm truncate">{camp.subject}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Mail size={10}/> {camp.sent_count} destinataire(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setExpandedId(expandedId === camp.id ? null : camp.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                        {expandedId === camp.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </button>
                      <button onClick={() => deleteCampaign(camp.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>
                  {expandedId === camp.id && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-4">Contenu envoyé</p>
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {camp.content}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button onClick={() => { setSubject(camp.subject); setContent(camp.content); setShowCompose(true); setExpandedId(null) }}
                          className="btn-outline btn-sm">
                          <Send size={13}/> Renvoyer cette campagne
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}