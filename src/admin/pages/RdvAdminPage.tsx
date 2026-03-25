import { useState, useEffect } from 'react'
import { Calendar, Phone, Mail, MapPin, Clock, Check, X, Trash2, Bell } from 'lucide-react'
import { supabase }   from '@/lib/supabase'
import { sendEmail }  from '@/lib/sendEmail'
import { formatDate } from '@/lib/utils'
import toast          from 'react-hot-toast'

interface Appointment {
  id:              string
  created_at:      string
  nom:             string
  email:           string
  phone:           string
  pays:            string
  ville:           string
  profession:      string
  service:         string
  date:            string
  time_slot:       string
  message:         string
  status:          'pending' | 'confirmed' | 'cancelled'
  client_notified: boolean
  notes:           string | null
}

const STATUS = {
  pending:   { label: 'En attente',  bg: 'bg-amber-100',  text: 'text-amber-700'  },
  confirmed: { label: 'Confirmé',    bg: 'bg-green-100',  text: 'text-green-700'  },
  cancelled: { label: 'Annulé',      bg: 'bg-red-100',    text: 'text-red-700'    },
}

const FILTERS = ['Tous', 'pending', 'confirmed', 'cancelled']

export default function RdvAdminPage() {
  const [rdvs,     setRdvs]     = useState<Appointment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('Tous')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [notes,    setNotes]    = useState('')
  const [sending,  setSending]  = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
    setRdvs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const pendingCount = rdvs.filter(r => r.status === 'pending').length

  const updateStatus = async (id: string, status: string) => {
    setSending(true)
    try {
      const rdv = rdvs.find(r => r.id === id)
      if (!rdv) return

      const { error } = await supabase
        .from('appointments')
        .update({ status, notes: notes || rdv.notes })
        .eq('id', id)
      if (error) throw error

      const emailType = status === 'confirmed' ? 'rdv_confirmed' : 'rdv_cancelled'
      await sendEmail({
        type: emailType,
        to:   rdv.email,
        data: {
          nom:     rdv.nom,
          service: rdv.service,
          date:    `${rdv.date} à ${rdv.time_slot}`,
          notes:   notes || '',
        },
      })

      await supabase.from('appointments').update({ client_notified: true }).eq('id', id)

      toast.success(status === 'confirmed'
        ? 'RDV confirmé — Email envoyé au client !'
        : 'RDV annulé — Client notifié par email'
      )
      load()
      setSelected(null)
      setNotes('')
    } catch {
      toast.error('Erreur')
    } finally {
      setSending(false)
    }
  }

  const deleteRdv = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return
    await supabase.from('appointments').delete().eq('id', id)
    toast.success('Supprimé')
    load()
    setSelected(null)
  }

  const filtered = rdvs.filter(r => filter === 'Tous' || r.status === filter)

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Rendez-vous</h1>
          <p className="text-gray-500 text-sm flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                <Bell size={10}/> {pendingCount} en attente
              </span>
            )}
            {rdvs.length} rendez-vous au total
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-navy hover:text-navy'
            }`}>
            {f === 'Tous' ? 'Tous' : STATUS[f as keyof typeof STATUS].label}
            <span className="ml-1.5 opacity-60">
              ({f === 'Tous' ? rdvs.length : rdvs.filter(r => r.status === f).length})
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"/>)
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-bold text-gray-700">Aucun rendez-vous</p>
            </div>
          ) : filtered.map(rdv => {
            const s = STATUS[rdv.status]
            return (
              <button key={rdv.id} onClick={() => { setSelected(rdv); setNotes(rdv.notes || '') }}
                className={`w-full card p-5 text-left transition-all hover:shadow-hover hover:-translate-y-0.5 ${
                  selected?.id === rdv.id ? 'border-navy' : ''
                } ${rdv.status === 'pending' ? 'border-l-4 border-l-amber-400' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[.65rem] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                      {!rdv.client_notified && rdv.status !== 'pending' && (
                        <span className="text-[.65rem] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Non notifié
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{rdv.nom}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{rdv.service}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-navy">{rdv.date}</p>
                    <p className="text-xs text-gray-400">{rdv.time_slot}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {selected ? (
          <div className="card p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">Détails du RDV</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16}/>
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { icon: Calendar, label: 'Date & Heure', val: `${selected.date} à ${selected.time_slot}` },
                { icon: Clock,    label: 'Service',      val: selected.service },
                { icon: Phone,    label: 'Téléphone',    val: <a href={`tel:${selected.phone}`} className="text-blue hover:underline">{selected.phone}</a> },
                { icon: Mail,     label: 'Email',        val: <a href={`mailto:${selected.email}`} className="text-blue hover:underline">{selected.email}</a> },
                { icon: MapPin,   label: 'Localisation', val: `${selected.ville}, ${selected.pays}` },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                    <Icon size={14}/>
                  </div>
                  <div>
                    <p className="text-[.65rem] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {selected.message && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-[.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">Message</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.message}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="label">Note interne (optionnel)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} className="input resize-none text-sm"
                placeholder="Note visible uniquement par l'équipe..."/>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Reçu le {formatDate(selected.created_at)}
              {selected.client_notified && (
                <span className="ml-2 text-green-600 font-semibold">✓ Client notifié</span>
              )}
            </p>

            {selected.status === 'pending' && (
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateStatus(selected.id, 'confirmed')} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60">
                  {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check size={15}/>}
                  Confirmer & Notifier
                </button>
                <button onClick={() => updateStatus(selected.id, 'cancelled')} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-100 text-red-600 text-sm font-bold hover:bg-red-200 transition-colors disabled:opacity-60">
                  <X size={15}/> Annuler & Notifier
                </button>
              </div>
            )}

            {selected.status === 'confirmed' && (
              <div className="bg-green-50 rounded-xl p-3 mb-2 text-center">
                <p className="text-green-700 text-sm font-bold">✓ RDV confirmé</p>
                {selected.client_notified && <p className="text-green-600 text-xs mt-0.5">Client notifié par email</p>}
              </div>
            )}

            {selected.status === 'cancelled' && (
              <div className="bg-red-50 rounded-xl p-3 mb-2 text-center">
                <p className="text-red-600 text-sm font-bold">✗ RDV annulé</p>
                {selected.client_notified && <p className="text-red-500 text-xs mt-0.5">Client notifié par email</p>}
              </div>
            )}

            <button onClick={() => deleteRdv(selected.id)}
              className="flex items-center justify-center gap-2 w-full mt-2 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 size={13}/> Supprimer
            </button>
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-400 h-fit">
            <Calendar size={32} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">Cliquez sur un RDV pour voir les détails</p>
          </div>
        )}
      </div>
    </div>
  )
}