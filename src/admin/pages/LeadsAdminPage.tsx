import { useState, useEffect } from 'react'
import { TrendingUp, Mail, Phone, Star, X, Check, AlertTriangle, AlertCircle, CheckCircle, ChevronDown, Target } from 'lucide-react'
import { supabase }   from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast          from 'react-hot-toast'

interface Lead {
  id:           string
  created_at:   string
  nom:          string
  email:        string
  phone:        string
  profession:   string
  test_key:     string
  test_title:   string
  score:        number
  max_score:    number
  percent:      number
  result_name:  string
  result_level: 'danger' | 'warning' | 'success'
  advice:       string
  cta:          string
  converted:    boolean
  rdv_offered:  boolean
  follow_up_j1: boolean
  follow_up_j3: boolean
  follow_up_j7: boolean
}

const LEVEL = {
  danger:  { label: 'Critique', bg: 'bg-red-100',   text: 'text-red-700',   Icon: AlertCircle   },
  warning: { label: 'Modéré',   bg: 'bg-amber-100', text: 'text-amber-700', Icon: AlertTriangle },
  success: { label: 'Positif',  bg: 'bg-green-100', text: 'text-green-700', Icon: CheckCircle   },
}

const SUPABASE_URL      = (import.meta as any).env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string

export default function LeadsAdminPage() {
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [filter,   setFilter]   = useState('Tous')

  const load = async () => {
    const { data } = await supabase
      .from('test_leads')
      .select('*')
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markConverted = async (id: string) => {
    await supabase.from('test_leads').update({ converted: true }).eq('id', id)
    toast.success('Marqué comme converti !')
    load()
  }

  const sendFollowUp = async (lead: Lead, day: 'j1' | 'j3' | 'j7') => {
    const messages = {
      j1: `Bonjour ${lead.nom},\n\nJ'espère que vous avez bien reçu votre analyse suite au test "${lead.test_title}".\n\nVotre score de ${lead.percent}% nous indique que vous avez besoin d'un accompagnement adapté. Avez-vous eu le temps de consulter nos recommandations ?\n\nNotre équipe est disponible pour un premier échange gratuit de 30 minutes. Souhaitez-vous en profiter ?\n\nCordialement,\nL'équipe GESTORH`,
      j3: `Bonjour ${lead.nom},\n\nIl y a 3 jours, vous avez passé notre diagnostic "${lead.test_title}" avec un score de ${lead.percent}%.\n\nNous pensons souvent à vous et aimerions vous aider à améliorer votre situation.\n\nN'hésitez pas à prendre rendez-vous - c'est gratuit et sans engagement.\n\nCordialement,\nL'équipe GESTORH`,
      j7: `Bonjour ${lead.nom},\n\nUne semaine s'est écoulée depuis votre diagnostic GESTORH. Avez-vous pu mettre en pratique certaines de nos recommandations ?\n\nSi vous souhaitez être accompagné(e) par un expert, nous sommes là pour vous.\n\nPrenez soin de vous.\n\nL'équipe GESTORH`,
    }
    const subjects = {
      j1: 'Suite à votre diagnostic GESTORH',
      j3: 'On pense à vous — GESTORH',
      j7: 'Comment allez-vous ? — GESTORH',
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Session expirée. Reconnectez-vous.'); return }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/email-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey':        SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          type: 'newsletter_custom',
          to:   lead.email,
          data: { subject: subjects[day], content: messages[day] },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || 'Erreur envoi')
      }
      const update = day === 'j1' ? { follow_up_j1: true } :
                     day === 'j3' ? { follow_up_j3: true } :
                                    { follow_up_j7: true }
      await supabase.from('test_leads').update(update).eq('id', lead.id)
      toast.success(`Email J+${day.slice(1)} envoyé !`)
      load()
      setSelected(prev => prev ? { ...prev, ...update } : null)
    } catch (err: any) {
      toast.error('Erreur : ' + err.message)
    }
  }

  const criticalCount  = leads.filter(l => l.result_level === 'danger' && !l.converted).length
  const convertedCount = leads.filter(l => l.converted).length

  const filtered = leads.filter(l =>
    filter === 'Tous'      ? true :
    filter === 'Critiques' ? l.result_level === 'danger' :
    filter === 'Convertis' ? l.converted :
    !l.converted
  )

  const FILTERS = [
    { key: 'Tous',       count: leads.length },
    { key: 'Critiques',  count: criticalCount },
    { key: 'Convertis',  count: convertedCount },
    { key: 'En cours',   count: leads.filter(l => !l.converted).length },
  ]

  // Composant détail inline
  const DetailPanel = ({ lead }: { lead: Lead }) => {
    const l = LEVEL[lead.result_level]
    return (
      <div className="card p-5 border-2 border-navy/20 bg-blue-soft/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-gray-900 text-sm">Détails du lead</h3>
          <button onClick={() => setSelected(null)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16}/>
          </button>
        </div>

        <div className={`rounded-xl p-3 mb-4 text-center ${l.bg}`}>
          <p className={`text-2xl font-black ${l.text}`}>{lead.percent}%</p>
          <p className="font-bold text-gray-900 text-xs">{lead.result_name}</p>
          <p className="text-xs text-gray-500">{lead.test_title}</p>
        </div>

        <div className="space-y-2 mb-4">
          {[
            { icon: Mail,  label: 'Email',      val: <a href={`mailto:${lead.email}`} className="text-blue hover:underline text-xs">{lead.email}</a> },
            { icon: Phone, label: 'Téléphone',  val: <a href={`tel:${lead.phone}`} className="text-blue hover:underline text-xs">{lead.phone}</a> },
            { icon: Star,  label: 'Profession', val: <span className="text-xs">{lead.profession}</span> },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex gap-2 items-center">
              <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={11} className="text-gray-500"/>
              </div>
              <div>
                <p className="text-[.6rem] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                {val}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Séquence de suivi</p>
          <div className="space-y-1.5">
            {[
              { key: 'j1' as const, label: 'J+1 — Rappel résultats',    done: lead.follow_up_j1 },
              { key: 'j3' as const, label: 'J+3 — On pense à vous',      done: lead.follow_up_j3 },
              { key: 'j7' as const, label: 'J+7 — Comment allez-vous ?', done: lead.follow_up_j7 },
            ].map(({ key, label, done }) => (
              <div key={key} className="flex items-center justify-between p-2.5 bg-white rounded-xl">
                <span className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-gray-600'}`}>
                  {done ? '✓ ' : ''}{label}
                </span>
                {!done && (
                  <button onClick={() => sendFollowUp(lead, key)}
                    className="text-xs font-bold text-blue bg-blue-soft px-2.5 py-1 rounded-lg hover:bg-blue/20 transition-colors">
                    Envoyer
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <a href={`mailto:${lead.email}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-mid transition-colors">
            <Mail size={13}/> Envoyer un email
          </a>
          <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25d366] text-white text-xs font-bold transition-colors">
            <Phone size={13}/> WhatsApp
          </a>
          {!lead.converted && (
            <button onClick={() => markConverted(lead.id)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 transition-colors">
              <Check size={13}/> Marquer comme converti
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          Lead créé le {formatDate(lead.created_at)}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl">

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Leads Tests</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {leads.length} prospects · {convertedCount} convertis · {criticalCount} cas critiques
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total leads',     value: leads.length,       color: 'bg-blue-500',   icon: TrendingUp    },
          { label: 'Cas critiques',   value: criticalCount,      color: 'bg-red-500',    icon: AlertTriangle },
          { label: 'Convertis',       value: convertedCount,     color: 'bg-green-500',  icon: Check         },
          { label: 'Taux conversion', value: leads.length > 0 ? Math.round((convertedCount / leads.length) * 100) + '%' : '0%', color: 'bg-purple-500', icon: Star },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-2`}>
              <Icon size={15} className="text-white"/>
            </div>
            <div className="text-xl font-black text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f.key ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-navy hover:text-navy'
            }`}>
            {f.key} <span className="ml-1 opacity-60">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Layout desktop : grille 2 colonnes / mobile : liste avec détail inline */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-5">

        {/* Liste */}
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"/>)
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Target size={32} className="text-gray-300 mb-3 mx-auto" />
              <p className="font-bold text-gray-700">Aucun lead</p>
            </div>
          ) : filtered.map(lead => {
            const l = LEVEL[lead.result_level]
            const isSelected = selected?.id === lead.id
            return (
              <div key={lead.id}>
                {/* Card lead */}
                <button onClick={() => setSelected(isSelected ? null : lead)}
                  className={`w-full card p-4 text-left transition-all hover:shadow-hover hover:-translate-y-0.5 ${
                    isSelected ? 'border-navy border-2' : ''
                  } ${lead.result_level === 'danger' && !lead.converted ? 'border-l-4 border-l-red-400' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[.65rem] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${l.bg} ${l.text}`}>
                          <l.Icon size={10} className="inline mr-0.5" /> {l.label}
                        </span>
                        {lead.converted && (
                          <span className="text-[.65rem] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Converti
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">{lead.nom}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.test_title} · {lead.result_name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className={`text-lg font-black ${l.text}`}>{lead.percent}%</p>
                        <p className="text-xs text-gray-400">{formatDate(lead.created_at)}</p>
                      </div>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSelected ? 'rotate-180' : ''}`}/>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[
                      { key: 'j1', done: lead.follow_up_j1, label: 'J+1' },
                      { key: 'j3', done: lead.follow_up_j3, label: 'J+3' },
                      { key: 'j7', done: lead.follow_up_j7, label: 'J+7' },
                    ].map(({ key, done, label }) => (
                      <span key={key} className={`text-[.6rem] font-bold px-2 py-0.5 rounded-full ${done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Détail inline sur mobile — s'affiche juste en dessous du lead */}
                {isSelected && (
                  <div className="lg:hidden mt-2">
                    <DetailPanel lead={lead}/>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Détail sur desktop — colonne droite sticky */}
        <div className="hidden lg:block">
          {selected ? (
            <div className="sticky top-6">
              <DetailPanel lead={selected}/>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">Cliquez sur un lead pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}