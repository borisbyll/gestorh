import { useState, useEffect, useRef } from 'react'
import { Link }                        from 'react-router-dom'
import { Helmet }                      from 'react-helmet-async'
import { motion, AnimatePresence }     from 'framer-motion'
import { useInView }                   from 'react-intersection-observer'
import { Star, ArrowRight, MapPin, Phone, Clock, Send, Check } from 'lucide-react'
import { useForm }                     from 'react-hook-form'
import { zodResolver }                 from '@hookform/resolvers/zod'
import { z }                           from 'zod'
import toast                           from 'react-hot-toast'
import Reveal                          from '@/components/ui/Reveal'
import SectionHeader                   from '@/components/ui/SectionHeader'
import ReviewForm                      from '@/components/reviews/ReviewForm'
import { supabase }                    from '@/lib/supabase'
import { ORG_SCHEMA }                  from '@/lib/seo'

const contactSchema = z.object({
  nom:     z.string().min(2, 'Nom requis'),
  email:   z.string().email('Email invalide'),
  phone:   z.string().min(8, 'Numéro requis'),
  service: z.string().min(1, 'Choisissez un service'),
  message: z.string().min(10, 'Message trop court'),
})
type ContactForm = z.infer<typeof contactSchema>

function useCounter(target: number, inView: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const dur = 1600; const start = performance.now()
    const step = (now: number) => {
      const p    = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(ease * target))
      if (p < 1) requestAnimationFrame(step); else setVal(target)
    }
    requestAnimationFrame(step)
  }, [inView, target])
  return val
}

const STATS = [
  { n: 10,  suf: '+', label: 'Années' },
  { n: 120, suf: '+', label: 'Entreprises' },
  { n: 850, suf: '+', label: 'Salariés formés' },
  { n: 45,  suf: '+', label: 'Couples accompagnés' },
  { n: 98,  suf: '%', label: 'Satisfaction' },
]

function StatCell({ n, suf, label }: { n: number; suf: string; label: string }) {
  const { ref, inView } = useInView({ triggerOnce: true })
  const val = useCounter(n, inView)
  return (
    <div ref={ref} className="py-10 px-4 text-center border-r border-white/[.07] last:border-r-0 hover:bg-white/[.03] transition-colors">
      <div className="text-3xl font-black text-white tracking-tight mb-1">{val}{suf}</div>
      <div className="text-[.67rem] font-semibold tracking-widest uppercase text-white/40">{label}</div>
    </div>
  )
}

interface Review { id: string; author_name: string; author_role: string; content: string; rating: number; service: string | null }

function OpenBadge() {
  const d = new Date(); const day = d.getDay(); const h = d.getHours()
  const open = (day >= 1 && day <= 5 && h >= 8 && h < 18) || (day === 6 && h >= 9 && h < 16)
  return (
    <div className="inline-flex items-center gap-2.5 border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold bg-white shadow-sm mb-8">
      <span className={`w-2.5 h-2.5 rounded-full ${open ? 'bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,.15)]' : 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,.15)]'}`}/>
      {open ? 'Ouvert maintenant' : 'Actuellement fermé'}
    </div>
  )
}

export default function HomePage() {
  const [reviews,   setReviews]   = useState<Review[]>([])
  const [showForm,  setShowForm]  = useState(false)
  const [contactOk, setContactOk] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = () => {
      if (heroRef.current) heroRef.current.style.transform = `translateY(${window.scrollY * .25}px)`
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    supabase.from('reviews').select('id,author_name,author_role,content,rating,service')
      .eq('approved', true).order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setReviews(data) })
  }, [])

  const { register: rc, handleSubmit: hsc, formState: { errors: ce, isSubmitting: cs } } =
    useForm<ContactForm>({ resolver: zodResolver(contactSchema) })

  const onContact = async (data: ContactForm) => {
    try {
      const { error } = await supabase.from('contacts').insert({ ...data, status: 'new' })
      if (error) throw error
      setContactOk(true)
      toast.success('Message envoyé ! Nous vous répondrons sous 24h.')
    } catch { toast.error('Erreur. Contactez-nous via WhatsApp.') }
  }

  const STATIC_REVIEWS = [
    { id: 's1', author_name: 'Directeur Général',  author_role: 'Secteur BTP — Togo',       content: 'Une restructuration qui a sauvé notre climat social. La productivité a suivi immédiatement.',                      rating: 5, service: 'Solutions RH'  },
    { id: 's2', author_name: 'Responsable RH',      author_role: 'Institution Financière',   content: "L'approche psychologique du cabinet est unique. Un soutien précieux pour nos cadres sous pression.",               rating: 5, service: 'Psychologie'   },
    { id: 's3', author_name: 'Promoteur PME',        author_role: 'Secteur Logistique',       content: "Un coaching qui m'a permis de retrouver une vision claire et de mieux déléguer.",                                  rating: 5, service: 'Coaching Pro'  },
  ]

  const displayReviews = reviews.length > 0 ? reviews : STATIC_REVIEWS

  return (
    <>
      <Helmet>
        <title>GESTORH — Excellence RH & Psychologie à Lomé, Togo</title>
        <meta name="description" content="Cabinet expert en Ressources Humaines, Psychologie et Coaching au Togo. +10 ans d'expertise à Lomé."/>
        <script type="application/ld+json">{JSON.stringify(ORG_SCHEMA)}</script>
      </Helmet>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[62vh] md:min-h-[70vh] flex items-center overflow-hidden">
        <div ref={heroRef} className="absolute inset-0 bg-cover bg-center will-change-transform"
          style={{ backgroundImage: "url('/hero.jpg')" }}/>
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/95 via-navy/85 to-navy/20"/>

        <div className="relative z-10 w-full px-6 md:px-16 py-16 md:py-28">
          <div className="max-w-[720px]">

            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs font-bold tracking-widest uppercase text-white/80 mb-6">
              <Star size={12} className="text-brand fill-brand"/> Cabinet RH & Psychologie — Lomé, Togo
            </motion.div>

            {/* Titre */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .2 }}
              className="text-4xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              Excellence<br/>Humaine &amp;<br/><span className="text-gradient">Performance RH</span>
            </motion.h1>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .32 }}
              className="text-white/65 text-base md:text-lg leading-relaxed mb-8 max-w-[520px]">
              Conseil stratégique, accompagnement psychologique et coaching de haut niveau pour dirigeants, équipes et particuliers au Togo.
            </motion.p>

            {/* Boutons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .44 }}
              className="flex flex-wrap gap-4">
              <Link to="/rendez-vous" className="btn-navy px-7 py-3.5 text-sm">
                Demander un diagnostic <ArrowRight size={15}/>
              </Link>
              <Link to="/tests" className="btn-ghost px-7 py-3.5 text-sm">
                Test gratuit
              </Link>
            </motion.div>

            {/* Mini stats */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .7, delay: .6 }}
              className="flex flex-wrap gap-8 mt-10 pt-8 border-t border-white/15">
              {[['10+','Années d\'expérience'],['120+','Entreprises clientes'],['98%','Taux de satisfaction']].map(([n,l]) => (
                <div key={l}>
                  <div className="text-2xl font-black text-white tracking-tight">{n}</div>
                  <div className="text-[.7rem] text-white/45 uppercase tracking-widest font-semibold mt-0.5">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent animate-bounce3"/>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <div className="bg-navy">
        <div className="wrap">
          <div className="grid grid-cols-2 md:grid-cols-5">
            {STATS.map(s => <StatCell key={s.label} {...s}/>)}
          </div>
        </div>
      </div>

      {/* ═══ EXPERTISES ═══ */}
      <section id="expertises" className="section bg-gray-50">
        <div className="wrap">
          <SectionHeader badge="Nos domaines" title="Nos" titleSpan="Expertises"
            sub="Une approche intégrée alliant sciences humaines, stratégie RH et développement personnel."/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { img: 'financial-advisor-sharing-his-expertise-regarding-pension-retirement-plans.jpg', n: '01', cat: 'RH',      title: 'Solutions RH',         items: ['Prévention des risques psychosociaux','Déploiement outils RH & digitalisation','Sélection & intégration des compétences','Audit organisationnel'] },
              { img: 'portrait-elegant-professional-businesswoman.jpg',                                 n: '02', cat: 'Coaching', title: 'Développement Pro',    items: ['Coaching professionnel','Évolution & insertion pro','Management & leadership','Bilan de compétences'] },
              { img: 'front-view-black-family-posing-studio.jpg',                                       n: '03', cat: 'Bien-être',title: 'Bien-être Personnel',  items: ['Accompagnement psychologique','Thérapie de couple & famille','Life Coaching','Gestion stress & burn-out'] },
            ].map((card, i) => (
              <Reveal key={card.n} delay={i * .1}>
                <article className="card-hover group overflow-hidden h-full">
                  <div className="h-52 relative overflow-hidden">
                    <img src={`/${card.img}`} alt={card.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent"/>
                    <span className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[.65rem] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full">
                      {card.n} — {card.cat}
                    </span>
                  </div>
                  <div className="p-7">
                    <h3 className="h3 mb-4">{card.title}</h3>
                    <ul className="space-y-2">
                      {card.items.map(it => (
                        <li key={it} className="flex items-center gap-2.5 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0"/>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BANNER TEST ═══ */}
      <section className="section">
        <div className="wrap">
          <Reveal>
            <div className="relative bg-navy rounded-3xl p-6 md:p-16 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue/30 blur-3xl pointer-events-none"/>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
                  Tests gratuits
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                  Évaluez votre situation<br/><span className="text-blue-300">en 2 minutes</span>
                </h2>
                <p className="text-white/50 text-sm">10 tests certifiés — Résultats immédiats</p>
              </div>
              <Link to="/tests" className="relative z-10 flex-shrink-0 btn-orange text-base px-8 py-4">
                Lancer un test gratuit <ArrowRight size={16}/>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ TÉMOIGNAGES ═══ */}
      <section id="temoignages" className="section bg-gray-50">
        <div className="wrap">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <SectionHeader badge="Témoignages" title="Ils nous font" titleSpan="confiance"/>
            <button onClick={() => setShowForm(v => !v)} className="btn-outline flex-shrink-0 flex">
              {showForm ? 'Annuler' : '⭐ Laisser un avis'}
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-10">
                <div className="card p-8 max-w-2xl">
                  <h3 className="h3 mb-6">Partagez votre expérience</h3>
                  <ReviewForm onDone={() => setShowForm(false)}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {displayReviews.map((r, i) => (
              <Reveal key={r.id} delay={i * .08}>
                <article className="card-hover p-8 flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} size={16} className={n <= r.rating ? 'text-brand fill-brand' : 'text-gray-200 fill-gray-100'}/>)}
                  </div>
                  <blockquote className="text-gray-700 text-sm leading-relaxed italic flex-1 border-l-[3px] border-brand pl-4">
                    "{r.content}"
                  </blockquote>
                  <footer>
                    <strong className="block text-sm font-bold text-gray-900">{r.author_name}</strong>
                    <span className="text-xs text-blue font-semibold">{r.author_role}</span>
                    {r.service && <span className="block text-xs text-gray-400 mt-0.5">{r.service}</span>}
                  </footer>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className="section">
        <div className="wrap">
          <SectionHeader badge="Contact" title="Prendre" titleSpan="Rendez-vous"/>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8 lg:gap-16 items-start">
            <aside>
              <OpenBadge/>
              {[
                { Icon: MapPin, label: 'Adresse',   val: <>Hédzranawoé, Rue N°4<br/>Lomé — Togo</> },
                { Icon: Phone,  label: 'Téléphone', val: <><a href="tel:+22898912369" className="hover:text-navy">+228 98 91 23 69</a><br/><a href="tel:+22890036187" className="hover:text-navy">+228 90 03 61 87</a></> },
                { Icon: Clock,  label: 'Horaires',  val: <>Lun–Ven 08h–18h<br/>Samedi 09h–16h</> },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="flex gap-4 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0 text-brand"><Icon size={18}/></div>
                  <div>
                    <div className="text-[.69rem] font-extrabold tracking-widest uppercase text-gray-400 mb-1">{label}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{val}</div>
                  </div>
                </div>
              ))}
              <Link to="/rendez-vous" className="btn-navy mt-4 w-full justify-center">
                Réserver un créneau <ArrowRight size={15}/>
              </Link>
            </aside>

            <Reveal>
              <div className="card p-8 md:p-10">
                <h3 className="h3 mb-7">Votre demande de consultation</h3>
                {contactOk ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Check size={28} className="text-green-600"/>
                    </div>
                    <h4 className="text-xl font-black mb-2">Message envoyé !</h4>
                    <p className="text-gray-500">Notre équipe vous répondra sous 24 à 48h.</p>
                  </div>
                ) : (
                  <form onSubmit={hsc(onContact)} noValidate className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Nom complet *</label>
                        <input {...rc('nom')} className={`input ${ce.nom ? 'input-err' : ''}`} placeholder="Votre nom"/>
                        {ce.nom && <p className="text-red-500 text-xs mt-1">{ce.nom.message}</p>}
                      </div>
                      <div>
                        <label className="label">Email *</label>
                        <input {...rc('email')} type="email" className={`input ${ce.email ? 'input-err' : ''}`} placeholder="votre@email.com"/>
                        {ce.email && <p className="text-red-500 text-xs mt-1">{ce.email.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">WhatsApp / Tél *</label>
                        <input {...rc('phone')} type="tel" className={`input ${ce.phone ? 'input-err' : ''}`} placeholder="+228 XX XX XX XX"/>
                        {ce.phone && <p className="text-red-500 text-xs mt-1">{ce.phone.message}</p>}
                      </div>
                      <div>
                        <label className="label">Service souhaité *</label>
                        <select {...rc('service')} className={`input ${ce.service ? 'input-err' : ''}`}>
                          <option value="">Choisir…</option>
                          <option>Psychologie / Soutien moral</option>
                          <option>Solutions RH</option>
                          <option>Coaching professionnel</option>
                          <option>Tests & Bilans</option>
                          <option>Thérapie de couple</option>
                        </select>
                        {ce.service && <p className="text-red-500 text-xs mt-1">{ce.service.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="label">Message *</label>
                      <textarea {...rc('message')} rows={4} className={`input resize-none ${ce.message ? 'input-err' : ''}`} placeholder="Décrivez brièvement votre situation…"/>
                      {ce.message && <p className="text-red-500 text-xs mt-1">{ce.message.message}</p>}
                    </div>
                    <button type="submit" disabled={cs} className="btn-navy w-full justify-center">
                      {cs ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={15}/>}
                      Envoyer ma demande
                    </button>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ LOCALISATION ═══ */}
      <section id="localisation" className="section bg-gray-50">
        <div className="wrap">
          <SectionHeader badge="Nous trouver" title="Notre" titleSpan="Cabinet"/>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-8 lg:gap-12 items-center">
            <div>
              {[
                { Icon: MapPin, label: 'Adresse',   val: <>Hédzranawoé, Rue N°4<br/>Près de la Rue 3353, Lomé — Togo</> },
                { Icon: Clock,  label: 'Horaires',  val: <>Lun–Ven 08h–18h · Sam 09h–16h</> },
                { Icon: Phone,  label: 'Téléphone', val: <a href="tel:+22898912369" className="hover:text-navy">+228 98 91 23 69</a> },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="flex gap-4 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0 text-brand"><Icon size={18}/></div>
                  <div>
                    <div className="text-[.69rem] font-extrabold tracking-widest uppercase text-gray-400 mb-1">{label}</div>
                    <div className="text-sm text-gray-600 leading-relaxed">{val}</div>
                  </div>
                </div>
              ))}
              <a href="https://www.google.com/maps?q=6.17736,1.23508" target="_blank" rel="noopener noreferrer" className="btn-navy mt-2">
                <MapPin size={15}/> Itinéraire Google Maps
              </a>
            </div>
            <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-card h-[280px] md:h-[420px]">
              <iframe src="https://maps.google.com/maps?q=6.17736,1.23508&z=15&output=embed"
                title="Localisation GESTORH" allowFullScreen loading="lazy"
                className="w-full h-full border-0"/>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}