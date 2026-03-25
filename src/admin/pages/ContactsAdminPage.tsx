import { useState, useEffect } from 'react'
import { Mail, Phone, X, Trash2, Check } from 'lucide-react'
import { supabase }   from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import toast          from 'react-hot-toast'

interface Contact {
  id:         string
  created_at: string
  nom:        string
  email:      string
  phone:      string
  service:    string
  message:    string
  status:     'new' | 'read' | 'replied'
}

const STATUS = {
  new:     { label: 'Nouveau',  bg: 'bg-blue-100',  text: 'text-blue-700'  },
  read:    { label: 'Lu',       bg: 'bg-gray-100',  text: 'text-gray-600'  },
  replied: { label: 'Répondu',  bg: 'bg-green-100', text: 'text-green-700' },
}

export default function ContactsAdminPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [filter,   setFilter]   = useState('Tous')

  const load = async () => {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('contacts').update({ status }).eq('id', id)
    load()
  }

  const openContact = async (contact: Contact) => {
    setSelected(contact)
    if (contact.status === 'new') await updateStatus(contact.id, 'read')
  }

  const markReplied = async (id: string) => {
    await updateStatus(id, 'replied')
    toast.success('Marqué comme répondu')
    load()
    setSelected(null)
  }

  const deleteContact = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return
    await supabase.from('contacts').delete().eq('id', id)
    toast.success('Message supprimé')
    load()
    setSelected(null)
  }

  const FILTERS = ['Tous', 'new', 'read', 'replied']
  const filtered = contacts.filter(c => filter === 'Tous' || c.status === filter)

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Contacts</h1>
        <p className="text-gray-500 text-sm">
          {contacts.filter(c => c.status === 'new').length} nouveau{contacts.filter(c => c.status === 'new').length > 1 ? 'x' : ''} message{contacts.filter(c => c.status === 'new').length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-navy hover:text-navy'
            }`}>
            {f === 'Tous' ? 'Tous' : STATUS[f as keyof typeof STATUS].label}
            <span className="ml-1.5 opacity-60">({f === 'Tous' ? contacts.length : contacts.filter(c => c.status === f).length})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* Liste */}
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">📬</p>
              <p className="font-bold text-gray-700">Aucun message</p>
            </div>
          ) : filtered.map(contact => {
            const s = STATUS[contact.status]
            return (
              <button key={contact.id} onClick={() => openContact(contact)}
                className={`w-full card p-5 text-left transition-all hover:shadow-hover hover:-translate-y-0.5 ${selected?.id === contact.id ? 'border-navy' : ''} ${contact.status === 'new' ? 'border-l-4 border-l-blue' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[.65rem] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400">{contact.service}</span>
                    </div>
                    <h3 className={`text-sm ${contact.status === 'new' ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                      {contact.nom}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{contact.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(contact.created_at)}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Détail */}
        {selected ? (
          <div className="card p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">{selected.nom}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16}/></button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><Mail size={14}/></div>
                <a href={`mailto:${selected.email}`} className="text-sm text-blue hover:underline font-medium">{selected.email}</a>
              </div>
              {selected.phone && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><Phone size={14}/></div>
                  <a href={`tel:${selected.phone}`} className="text-sm text-blue hover:underline font-medium">{selected.phone}</a>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-[.65rem] font-bold text-gray-400 uppercase tracking-widest mb-2">Service demandé</p>
              <p className="text-sm font-semibold text-navy">{selected.service}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-[.65rem] font-bold text-gray-400 uppercase tracking-widest mb-2">Message</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.message}</p>
            </div>

            <p className="text-xs text-gray-400 mb-5">Reçu le {formatDate(selected.created_at)}</p>

            <div className="space-y-2">
              <a href={`mailto:${selected.email}?subject=Re: ${selected.service} - GESTORH`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-mid transition-colors">
                <Mail size={15}/> Répondre par email
              </a>
              {selected.status !== 'replied' && (
                <button onClick={() => markReplied(selected.id)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold hover:bg-green-200 transition-colors">
                  <Check size={15}/> Marquer comme répondu
                </button>
              )}
              <button onClick={() => deleteContact(selected.id)}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                <Trash2 size={13}/> Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center text-gray-400 h-fit">
            <Mail size={32} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">Cliquez sur un message pour le lire</p>
          </div>
        )}
      </div>
    </div>
  )
}