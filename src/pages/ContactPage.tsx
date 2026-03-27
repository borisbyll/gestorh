import { useState }     from 'react'
import { Helmet }       from 'react-helmet-async'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import { z }            from 'zod'
import { MapPin, Phone, Clock, MessageCircle, Send, Check } from 'lucide-react'
import toast            from 'react-hot-toast'
import { supabase }     from '@/lib/supabase'
import { sendEmail }    from '@/lib/sendEmail'
import Reveal           from '@/components/ui/Reveal'

const schema = z.object({
  nom:     z.string().min(2, 'Nom requis'),
  email:   z.string().email('Email invalide'),
  phone:   z.string().optional(),
  service: z.string().min(1, 'Choisissez un service'),
  message: z.string().min(10, 'Message trop court'),
})
type Form = z.infer<typeof schema>

function OpenBadge() {
  const d = new Date(); const day = d.getDay(); const h = d.getHours()
  const open = (day >= 1 && day <= 5 && h >= 8 && h < 18) || (day === 6 && h >= 9 && h < 16)
  return (
    <div className="inline-flex items-center gap-2.5 border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold bg-white shadow-sm">
      <span className={`w-2.5 h-2.5 rounded-full ${open ? 'bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,.15)]' : 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,.15)]'}`}/>
      {open ? 'Ouvert maintenant' : 'Actuellement fermé'}
    </div>
  )
}

export default function ContactPage() {
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    try {
      const { error } = await supabase.from('contacts').insert({ ...data, status: 'new' })
      if (error) throw error

      await sendEmail({
        type: 'contact_received',
        to:   'contact@gestorh.tg',
        data: {
          nom:     data.nom,
          email:   data.email,
          phone:   data.phone || '-',
          service: data.service,
          message: data.message,
        },
      })

      setDone(true)
      toast.success('Message envoyé avec succès !')
    } catch {
      toast.error('Erreur. Contactez-nous directement via WhatsApp.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact | GESTORH</title>
        <meta name="description" content="Contactez le cabinet GESTORH à Lomé, Togo."/>
      </Helmet>

      <div className="bg-gradient-to-br from-navy-deep to-navy py-10 md:py-14 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue/20 blur-3xl"/>
        </div>
        <div className="relative z-10">
          <span className="badge mb-4">Contactez-nous</span>
          <h1 className="h1 text-white mb-4">Parlons de votre <span className="text-gradient">situation</span></h1>
          <p className="text-white/55 text-base max-w-md mx-auto">
            Notre équipe vous répond sous 24 à 48h. Toutes vos informations sont confidentielles.
          </p>
        </div>
      </div>

      <div className="wrap py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-16 items-start">
          <aside>
            <div className="mb-8"><OpenBadge/></div>
            {[
              { icon: MapPin,         label: 'Adresse',   content: <>Hédzranawoé, Rue N°4<br/>Près de la Rue 3353<br/>Lomé — Togo</> },
              { icon: Phone,          label: 'Téléphone', content: <><a href="tel:+22898912369" className="hover:text-navy">+228 98 91 23 69</a><br/><a href="tel:+22890036187" className="hover:text-navy">+228 90 03 61 87</a></> },
              { icon: MessageCircle,  label: 'WhatsApp',  content: <a href="https://wa.me/22898912369" target="_blank" rel="noopener noreferrer" className="hover:text-navy">+228 98 91 23 69</a> },
              { icon: Clock,          label: 'Horaires',  content: <>Lun – Ven : 08h00 – 18h00<br/>Samedi : 09h00 – 16h00</> },
            ].map(({ icon: Icon, label, content }) => (
              <div key={label} className="flex gap-4 mb-7">
                <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0 text-brand">
                  <Icon size={18}/>
                </div>
                <div>
                  <div className="text-[.69rem] font-extrabold tracking-widest uppercase text-gray-400 mb-1">{label}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">{content}</div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-card mt-8" style={{ height: 220 }}>
              <iframe src="https://maps.google.com/maps?q=6.17736,1.23508&z=15&output=embed"
                title="GESTORH sur Google Maps" allowFullScreen loading="lazy"
                className="w-full h-full border-0"/>
            </div>
            <a href="https://www.google.com/maps?q=6.17736,1.23508" target="_blank" rel="noopener noreferrer"
              className="btn-outline w-full justify-center mt-3 text-sm">
              <MapPin size={14}/> Ouvrir dans Google Maps
            </a>
          </aside>

          <Reveal>
            <div className="card p-8 md:p-10">
              <h2 className="h3 mb-7">Envoyer un message</h2>
              {done ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                    <Check size={30} className="text-green-600"/>
                  </div>
                  <h3 className="text-xl font-black mb-2">Message envoyé !</h3>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Notre équipe vous répondra dans les 24 à 48h ouvrées.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Nom complet *</label>
                      <input {...register('nom')} className={`input ${errors.nom ? 'input-err' : ''}`} placeholder="Votre nom"/>
                      {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
                    </div>
                    <div>
                      <label className="label">Email *</label>
                      <input {...register('email')} type="email" className={`input ${errors.email ? 'input-err' : ''}`} placeholder="votre@email.com"/>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">WhatsApp / Téléphone</label>
                      <input {...register('phone')} type="tel" className="input" placeholder="+228 XX XX XX XX"/>
                    </div>
                    <div>
                      <label className="label">Service souhaité *</label>
                      <select {...register('service')} className={`input ${errors.service ? 'input-err' : ''}`}>
                        <option value="">Choisir…</option>
                        <option>Psychologie / Soutien moral</option>
                        <option>Solutions RH</option>
                        <option>Coaching professionnel</option>
                        <option>Tests & Bilans</option>
                        <option>Thérapie de couple & famille</option>
                        <option>Autre demande</option>
                      </select>
                      {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="label">Votre message *</label>
                    <textarea {...register('message')} rows={5}
                      className={`input resize-none ${errors.message ? 'input-err' : ''}`}
                      placeholder="Décrivez votre situation ou posez votre question…"/>
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn-navy w-full justify-center">
                    {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={15}/>}
                    Envoyer le message
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Toutes vos informations sont strictement confidentielles.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  )
}