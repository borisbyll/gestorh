import { useState, useEffect }    from 'react'
import { Helmet }                  from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm }                 from 'react-hook-form'
import { zodResolver }             from '@hookform/resolvers/zod'
import { z }                       from 'zod'
import { Check, ChevronLeft, ChevronRight, Calendar, User, MessageSquare, AlertCircle } from 'lucide-react'
import { addDays, format, startOfToday, isBefore, isWeekend } from 'date-fns'
import { fr }                      from 'date-fns/locale'
import toast                       from 'react-hot-toast'
import { supabase }                from '@/lib/supabase'
import { cn }                      from '@/lib/utils'

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string

const SERVICES = [
  'Psychologie / Soutien moral',
  'Solutions RH',
  'Coaching professionnel',
  'Bilan de compétences',
  'Thérapie de couple & famille',
  'Test & Bilan approfondi',
]

const ALL_SLOTS = [
  '08:00','09:15','10:30','11:45',
  '14:00','15:15','16:30',
]

const schema = z.object({
  nom:        z.string().min(2, 'Nom requis'),
  email:      z.string().email('Email invalide'),
  phone:      z.string().min(8, 'Numéro requis'),
  pays:       z.string().min(2, 'Pays requis'),
  ville:      z.string().min(2, 'Ville requise'),
  profession: z.string().min(2, 'Profession requise'),
  message:    z.string().min(10, 'Décrivez brièvement votre situation'),
})
type Form = z.infer<typeof schema>

function MiniCalendar({ selected, onSelect, bookedDates }: {
  selected: Date | null
  onSelect: (d: Date) => void
  bookedDates: string[]
}) {
  const today = startOfToday()
  const [view, setView] = useState(today)

  const days: Date[] = []
  const start = new Date(view.getFullYear(), view.getMonth(), 1)
  const end   = new Date(view.getFullYear(), view.getMonth() + 1, 0)
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) days.push(new Date(d))

  const isAvailable = (d: Date) => {
    if (isBefore(d, today) || isWeekend(d)) return false
    const dateStr = format(d, 'yyyy-MM-dd')
    const bookedCount = bookedDates.filter(b => b === dateStr).length
    return bookedCount < ALL_SLOTS.length
  }

  const isFullyBooked = (d: Date) => {
    const dateStr = format(d, 'yyyy-MM-dd')
    return bookedDates.filter(b => b === dateStr).length >= ALL_SLOTS.length
  }

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronLeft size={18}/>
        </button>
        <span className="font-bold text-sm capitalize">{format(view, 'MMMM yyyy', { locale: fr })}</span>
        <button onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronRight size={18}/>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => (
          <div key={d} className="text-center text-[.65rem] font-bold text-gray-400 uppercase py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: (start.getDay() || 7) - 1 }).map((_, i) => <div key={i}/>)}
        {days.map(d => {
          const avail   = isAvailable(d)
          const full    = isFullyBooked(d)
          const weekend = isWeekend(d)
          const past    = isBefore(d, today)
          const sel     = selected && format(d, 'yyyy-MM-dd') === format(selected, 'yyyy-MM-dd')
          return (
            <button key={d.toISOString()} onClick={() => avail && onSelect(d)} disabled={!avail}
              className={cn(
                'w-full aspect-square rounded-xl text-xs font-bold transition-all relative',
                sel    && 'bg-navy text-white shadow-lg scale-105',
                !sel && avail  && 'hover:bg-blue-soft text-gray-900 hover:text-navy',
                full   && !sel && 'bg-red-50 text-red-300 cursor-not-allowed',
                (weekend || past) && !sel && 'text-gray-200 cursor-not-allowed'
              )}>
              {d.getDate()}
              {full && !past && !weekend && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400"/>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex gap-4 mt-4 text-xs text-gray-400 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-soft border border-navy/20"/> Disponible</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50"/> Complet</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-navy"/> Sélectionné</span>
      </div>
    </div>
  )
}

const STEPS = [
  { label: 'Service',       icon: MessageSquare },
  { label: 'Date & Heure',  icon: Calendar },
  { label: 'Informations',  icon: User },
]

export default function RdvPage() {
  const [step,          setStep]         = useState(0)
  const [service,       setService]      = useState('')
  const [date,          setDate]         = useState<Date | null>(null)
  const [slot,          setSlot]         = useState('')
  const [done,          setDone]         = useState(false)
  const [bookedSlots,   setBookedSlots]  = useState<string[]>([])
  const [bookedDates,   setBookedDates]  = useState<string[]>([])
  const [loadingSlots,  setLoadingSlots] = useState(false)
  const [suggestedDate, setSuggestedDate]= useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) })

  useEffect(() => {
    supabase.from('appointments')
      .select('date, time_slot')
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => {
        if (data) setBookedDates(data.map(d => d.date))
      })
  }, [])

  useEffect(() => {
    if (!date) return
    setLoadingSlots(true)
    setSlot('')
    const dateStr = format(date, 'yyyy-MM-dd')
    supabase.from('appointments')
      .select('time_slot')
      .eq('date', dateStr)
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => {
        setBookedSlots(data?.map(d => d.time_slot) || [])
        setLoadingSlots(false)
      })
  }, [date])

  const getAvailableSlots = () => ALL_SLOTS.filter(s => !bookedSlots.includes(s))

  const handleSlotSelect = (s: string) => {
    if (bookedSlots.includes(s)) {
      const next = ALL_SLOTS.find(sl => !bookedSlots.includes(sl))
      if (next) setSuggestedDate(`Le créneau ${s} est déjà pris. Créneau disponible : ${next}`)
      return
    }
    setSuggestedDate(null)
    setSlot(s)
  }

  const onSubmit = async (data: Form) => {
    if (!date || !slot) return
    try {
      // Enregistrer le RDV
      const { error } = await supabase.from('appointments').insert({
        ...data, service,
        date:      format(date, 'yyyy-MM-dd'),
        time_slot: slot,
        status:    'pending',
      })
      if (error) throw error

      const dateStr = `${format(date, 'EEEE d MMMM yyyy', { locale: fr })} à ${slot}`

      // Email confirmation client — via email-proxy-public (action publique)
      await fetch(`${SUPABASE_URL}/functions/v1/email-proxy-public`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rdv_confirmation',
          to:   data.email,
          data: {
            nom:     data.nom,
            service,
            date:    dateStr,
          },
        }),
      })

      // Notification admin — via email-proxy-public
      await fetch(`${SUPABASE_URL}/functions/v1/email-proxy-public`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact_received',
          to:   'contact@gestorh.tg',
          data: {
            nom:     data.nom,
            email:   data.email,
            phone:   data.phone,
            service: `${service} — ${format(date, 'dd/MM/yyyy')} à ${slot}`,
            message: data.message,
          },
        }),
      })

      setDone(true)
      toast.success('RDV enregistré ! Confirmation envoyée par email.')
    } catch {
      toast.error('Erreur. Contactez-nous via WhatsApp.')
    }
  }

  const canNext = [service !== '', date !== null && slot !== '']

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card p-12 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check size={36} className="text-green-600"/>
        </div>
        <h2 className="h2 mb-3">Demande envoyée !</h2>
        <p className="text-gray-500 mb-2">Un email de confirmation vous a été envoyé.</p>
        <p className="text-gray-500 text-sm mb-8">
          Notre équipe vous recontactera sous <strong>24 à 48h</strong> pour valider le créneau.
        </p>
        <div className="bg-gray-50 rounded-2xl p-5 text-sm text-left space-y-2">
          <div className="flex gap-2"><span className="font-bold text-gray-700 w-20">Service</span><span className="text-gray-500">{service}</span></div>
          {date && <div className="flex gap-2"><span className="font-bold text-gray-700 w-20">Date</span><span className="text-gray-500">{format(date, 'EEEE d MMMM yyyy', { locale: fr })}</span></div>}
          <div className="flex gap-2"><span className="font-bold text-gray-700 w-20">Heure</span><span className="text-gray-500">{slot}</span></div>
        </div>
      </motion.div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>Prendre Rendez-vous | GESTORH</title>
        <meta name="description" content="Réservez votre consultation avec GESTORH en ligne en quelques minutes."/>
      </Helmet>

      <div className="bg-gradient-to-br from-navy-deep to-navy py-20 px-5 text-center">
        <span className="badge mb-4">Réservation en ligne</span>
        <h1 className="h1 text-white mb-3">Prendre <span className="text-gradient">Rendez-vous</span></h1>
        <p className="text-white/50 text-base max-w-md mx-auto">3 étapes simples · Confirmation par email · Créneaux en temps réel</p>
      </div>

      <div className="wrap py-16 max-w-4xl">
        <div className="flex items-center justify-center mb-14">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
                i === step && 'bg-navy text-white shadow-lg',
                i <  step  && 'bg-green-100 text-green-700',
                i >  step  && 'text-gray-400'
              )}>
                {i < step ? <Check size={14}/> : <s.icon size={14}/>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-0.5 mx-1', i < step ? 'bg-green-400' : 'bg-gray-200')}/>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: .3 }}>

            {/* ── STEP 0 : Service ── */}
            {step === 0 && (
              <div>
                <h2 className="h2 text-center mb-8">Quel service souhaitez-vous ?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {SERVICES.map(s => (
                    <button key={s} onClick={() => setService(s)}
                      className={cn(
                        'p-5 rounded-2xl border-2 text-left text-sm font-semibold transition-all',
                        service === s ? 'border-navy bg-navy text-white' : 'border-gray-200 hover:border-navy hover:bg-blue-soft text-gray-900'
                      )}>
                      {service === s && <Check size={14} className="mb-2"/>}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 1 : Date & Heure ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                <div className="card p-6">
                  <h3 className="font-black text-base mb-5">Choisissez une date</h3>
                  <MiniCalendar selected={date} onSelect={setDate} bookedDates={bookedDates}/>
                </div>
                <div className="card p-6">
                  <h3 className="font-black text-base mb-5">
                    {date ? `Créneaux du ${format(date, 'd MMMM', { locale: fr })}` : "Sélectionnez d'abord une date"}
                  </h3>
                  {date && (
                    <>
                      {suggestedDate && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 font-medium">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
                          {suggestedDate}
                        </div>
                      )}
                      {loadingSlots ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}
                        </div>
                      ) : getAvailableSlots().length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-red-500 font-bold text-sm mb-2">Journée complète</p>
                          <p className="text-gray-400 text-xs">Veuillez choisir une autre date</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {ALL_SLOTS.map(s => {
                            const booked = bookedSlots.includes(s)
                            return (
                              <button key={s} onClick={() => handleSlotSelect(s)} disabled={booked}
                                className={cn(
                                  'py-2.5 rounded-xl text-xs font-bold border-2 transition-all relative',
                                  slot === s && !booked ? 'border-navy bg-navy text-white' :
                                  booked ? 'border-red-100 bg-red-50 text-red-300 cursor-not-allowed line-through' :
                                  'border-gray-200 hover:border-navy hover:bg-blue-soft text-gray-900'
                                )}>
                                {s}
                                {booked && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white"/>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      <div className="flex gap-3 mt-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-gray-200 bg-white"/> Libre</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-100"/> Pris</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-navy"/> Choisi</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2 : Infos ── */}
            {step === 2 && (
              <form id="rdv-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="card p-8 max-w-2xl mx-auto">
                  <h2 className="h3 mb-7">Vos informations</h2>
                  <div className="bg-blue-soft rounded-2xl p-4 mb-7 text-sm">
                    <p className="font-bold text-navy">{service}</p>
                    {date && <p className="text-gray-600">{format(date, 'EEEE d MMMM yyyy', { locale: fr })} à {slot}</p>}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nom complet *</label>
                        <input {...register('nom')} className={`input ${errors.nom ? 'input-err' : ''}`} placeholder="Jean Kodjo"/>
                        {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
                      </div>
                      <div>
                        <label className="label">Email *</label>
                        <input {...register('email')} type="email" className={`input ${errors.email ? 'input-err' : ''}`} placeholder="jean@email.com"/>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">WhatsApp / Tél *</label>
                        <input {...register('phone')} type="tel" className={`input ${errors.phone ? 'input-err' : ''}`} placeholder="+228 XX XX XX XX"/>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                      </div>
                      <div>
                        <label className="label">Profession *</label>
                        <input {...register('profession')} className={`input ${errors.profession ? 'input-err' : ''}`} placeholder="Directeur RH"/>
                        {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Pays *</label>
                        <input {...register('pays')} className={`input ${errors.pays ? 'input-err' : ''}`} placeholder="Togo"/>
                        {errors.pays && <p className="text-red-500 text-xs mt-1">{errors.pays.message}</p>}
                      </div>
                      <div>
                        <label className="label">Ville *</label>
                        <input {...register('ville')} className={`input ${errors.ville ? 'input-err' : ''}`} placeholder="Lomé"/>
                        {errors.ville && <p className="text-red-500 text-xs mt-1">{errors.ville.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="label">Votre situation (confidentiel) *</label>
                      <textarea {...register('message')} rows={4}
                        className={`input resize-none ${errors.message ? 'input-err' : ''}`}
                        placeholder="Décrivez brièvement ce qui vous amène à consulter…"/>
                      {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                    </div>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-10 max-w-2xl mx-auto">
          <button onClick={() => setStep(v => v - 1)} disabled={step === 0}
            className="btn-outline disabled:opacity-0 disabled:pointer-events-none">
            <ChevronLeft size={16}/> Retour
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(v => v + 1)} disabled={!canNext[step]}
              className="btn-navy disabled:opacity-40 disabled:cursor-not-allowed">
              Suivant <ChevronRight size={16}/>
            </button>
          ) : (
            <button type="submit" form="rdv-form" disabled={isSubmitting} className="btn-navy">
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <Check size={16}/>
              }
              Confirmer le RDV
            </button>
          )}
        </div>
      </div>
    </>
  )
}