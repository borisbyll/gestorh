import { useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, TrendingUp, Heart, Users, Lightbulb,
  Award, Clock, ChevronDown, CheckCircle,
  Target, Zap, Shield, BarChart3, Star
} from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import WaButton from '@/components/ui/WaButton'

// ── Données ──────────────────────────────────────────────────────────────────

const coachingIndividuel = [
  {
    icon: TrendingUp,
    theme: 'Évolution de carrière',
    color: 'from-blue-500 to-navy',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
    resultats: ['Projet professionnel réajusté', 'Maîtrise des techniques de repositionnement'],
    activites: ['Écoute active', 'Analyse situationnelle', 'Bilan de compétences', 'Projection pro'],
  },
  {
    icon: Heart,
    theme: 'Équilibre Vie Pro / Perso',
    color: 'from-rose-400 to-pink-600',
    bg: 'bg-rose-50',
    textColor: 'text-rose-500',
    resultats: ['Stress réduit', 'Productivité personnelle améliorée'],
    activites: ['Diagnostic équilibre', "Plan d'action personnalisé"],
  },
  {
    icon: Zap,
    theme: 'Motivation & Implication',
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    textColor: 'text-amber-500',
    resultats: ['Engagement intrinsèque accru', 'Productivité organisationnelle revalorisée'],
    activites: ['Coaching motivation', "Développement de l'implication"],
  },
  {
    icon: Shield,
    theme: 'Gestion des Tensions',
    color: 'from-teal-400 to-emerald-600',
    bg: 'bg-teal-50',
    textColor: 'text-teal-500',
    resultats: ['Prévention des conflits maîtrisée', 'Climat social serein'],
    activites: ['Médiation', 'Ateliers gestion des tensions'],
  },
]

const coachingCollectif = [
  { Icon: Award,     theme: 'Leadership Impactant',     resultats: 'Identification du style propre & outils pratiques de leadership.' },
  { Icon: Users,     theme: "Cohésion d'Équipe",         resultats: "Synergie d'actions productives & unité renforcée." },
  { Icon: Shield,    theme: 'Vigilance & Résilience',   resultats: "Outils pratiques pour la prévention du Burnout." },
  { Icon: Lightbulb, theme: "Culture de l'Innovation",  resultats: 'Développement de la capacité créative collective.' },
]

const packs = [
  {
    key: 'or', label: 'PACK OR', emoji: '🌟', sessions: "12 séances · 1h", tagline: 'Expertise Totale',
    desc: "Diagnostic complet, exploration profonde et livraison d'un nouveau projet professionnel clé en main.",
    services: ['Bilan personnel approfondi', 'Bilan de formation', 'Exploration des compétences', "Recherche d'alternatives", 'Rédaction du projet professionnel'],
    resultat: 'Profil approfondi & parcours adapté éclairé',
    accent: '#f2a93b', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', featured: true,
  },
  {
    key: 'bronze', label: 'PACK BRONZE', emoji: '⚓', sessions: "8 séances · 1h", tagline: "L'Essentiel",
    desc: "Découverte du profil et élaboration d'un projet professionnel structuré.",
    services: ['Bilan personnel & de formation', 'Exploration des compétences'],
    resultat: 'Profil découvert & projet professionnel élaboré',
    accent: '#cd7f32', bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', featured: false,
  },
  {
    key: 'argent', label: 'PACK ARGENT', emoji: '⚡', sessions: "4 séances · 1h", tagline: 'Le Tremplin',
    desc: 'Bilan rapide de profil pour une prise de décision éclairée.',
    services: ['Bilan personnel', 'Bilan professionnel'],
    resultat: 'Découverte des profils perso/pro',
    accent: '#8e9bae', bg: 'from-slate-50 to-gray-50', border: 'border-slate-200', featured: false,
  },
]

const formations = [
  {
    num: '01', Icon: BarChart3, titre: 'Management Opérationnel & Stratégique',
    impact: 'Performance managériale & Efficacité institutionnelle.',
    livrables: ['Rapport de formation', 'Plan de suivi personnalisé', 'Guide recommandations'],
    textColor: 'text-blue-600', bgIcon: 'bg-blue-100',
  },
  {
    num: '02', Icon: Zap, titre: 'Ingénierie de la Motivation',
    impact: "Politiques de motivation adaptées & Engagement maximal de l'employé.",
    livrables: [], textColor: 'text-brand', bgIcon: 'bg-brand/10',
  },
  {
    num: '03', Icon: Users, titre: "Cohésion de Haute Volée",
    impact: "Rôles clarifiés & Synergie interne remobilisée.",
    livrables: [], textColor: 'text-teal-600', bgIcon: 'bg-teal-100',
  },
]

const modalites = [
  { duree: '1 Jour',  pack: 'Pack 1', avantage: 'Support de formation + 1 séance de coaching de suivi', icon: '📄' },
  { duree: '3 Jours', pack: 'Pack 2', avantage: "Support + e-book d'approfondissement exclusif", icon: '📚' },
  { duree: '5 Jours', pack: 'Pack 3', avantage: 'Support + Clé USB avec dossier complet', icon: '💾' },
]

const refs = [
  {
    cat: 'SOCIÉTÉS & ENTREPRISES', icon: '🏢', color: 'border-brand',
    items: ['BB LOME', 'CFAO MOTORS', 'NOVATECH', 'DIGI JOB', 'GADEDE SARL', 'CMS LE JADE', 'UNIPACK', 'CFSP', 'CABINET UPDATE CONSEIL', 'EMERGENCE SARL', 'IFBE SOLUTIONS', 'GVA', 'KOKO INTERNATIONAL'],
  },
  {
    cat: 'ÉCOLES & FORMATION', icon: '🎓', color: 'border-blue-400',
    items: ['LBS', 'DEFITECH', 'ESGIS', 'ESIBA', 'ISAGES', 'IFF AFRIQUE'],
  },
  {
    cat: 'ONG & ASSOCIATIONS', icon: '🤝', color: 'border-teal-400',
    items: ['LIONS CLUB', 'ROTARY CLUB', 'WILDAF', 'ONG ANGE', 'MIAWODO', 'MIVO ÉNERGIE', 'PDS AFRIQUE', 'CENTRE NAOUSSI', 'FONDACIO', 'SICHEM/AGRO-DR'],
  },
  {
    cat: 'COMMUNAUTÉS RELIGIEUSES', icon: '⛪', color: 'border-emerald-400',
    items: ['SMA', 'SŒURS FRANCISCAINES', 'COMMUNAUTÉ SAINT JEAN', 'MISSIONNAIRES COMBONIENS', 'PETITES SŒURS STE FAMILLE'],
  },
]

// ── Micro-composants ─────────────────────────────────────────────────────────

function Check({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle size={13} className={`flex-shrink-0 mt-0.5 ${light ? 'text-brand' : 'text-green-500'}`} />
      <span className={`text-sm leading-relaxed ${light ? 'text-white/80' : 'text-gray-600'}`}>{text}</span>
    </li>
  )
}

function Pill({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-brand/10 text-brand text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
      {icon}{label}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function OffresPage() {
  return (
    <>
      <Helmet>
        <title>Nos Offres & Services | GESTORH</title>
        <meta name="description" content="Coaching individuel, coaching collectif, bilan de compétences, formations stratégiques. Cabinet RH & Psychologie à Lomé, Togo." />
      </Helmet>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-navy-deep via-navy to-[#1a3a7a] overflow-hidden min-h-[88vh] flex items-center">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <motion.div animate={{ y: [-12,12,-12] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 right-16 w-64 h-64 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        <motion.div animate={{ y: [10,-10,10] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-white/5 pointer-events-none" />

        <div className="wrap relative z-10 py-24">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="badge mb-6">Nos Offres & Services</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16,1,0.3,1] }}
              className="h1 text-white mb-6 leading-[1.05]">
              Révéler l'Humain,{' '}
              <span className="text-gradient">Propulser la Performance</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="text-white/60 text-lg leading-relaxed mb-10 max-w-2xl">
              Accompagnement psychologique, développement professionnel et optimisation des performances humaines. Des solutions sur mesure pour chaque organisation.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap gap-3">
              <Link to="/rendez-vous" className="btn-navy">Diagnostic gratuit <ArrowRight size={15} /></Link>
              <WaButton className="btn-outline !border-white/30 !text-white hover:!bg-white/10" />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-16">
            {[
              { val: '+10 ans', label: "d'expertise",  icon: '⭐' },
              { val: '+40',    label: 'partenaires',   icon: '🤝' },
              { val: '4',      label: 'pôles métier',  icon: '🎯' },
              { val: '100%',   label: 'sur mesure',    icon: '✨' },
            ].map(k => (
              <div key={k.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-4 text-center">
                <div className="text-xl mb-1">{k.icon}</div>
                <div className="text-2xl font-black text-white">{k.val}</div>
                <div className="text-white/50 text-xs font-medium mt-0.5">{k.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div animate={{ y: [0,8,0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30">
          <ChevronDown size={24} />
        </motion.div>
      </div>

      {/* ══ APPROCHE ══════════════════════════════════════════════════════════ */}
      <section className="section bg-white">
        <div className="wrap">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Pill label="Notre vision" icon={<Target size={12} />} />
              <h2 className="h2 mb-4">Une approche qui fait la différence</h2>
              <p className="text-gray-500 leading-relaxed">Expertise scientifique, méthodes pratiques et accompagnement personnalisé.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '🎯', title: 'Sur Mesure',            desc: 'Chaque solution adaptée à votre situation',       color: 'bg-brand/10', border: 'border-brand/20' },
              { icon: '🔬', title: 'Approche Scientifique', desc: 'Méthodes validées cliniquement et certifiées',    color: 'bg-blue-50',  border: 'border-blue-200' },
              { icon: '🔒', title: 'Confidentialité',       desc: 'Discrétion absolue garantie à chaque étape',     color: 'bg-teal-50',  border: 'border-teal-200' },
              { icon: '📈', title: 'Impact Mesurable',      desc: 'Des résultats concrets que vous pouvez évaluer', color: 'bg-green-50', border: 'border-green-200' },
            ].map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}
                  className={`card p-6 text-center h-full border ${v.border} cursor-default`}>
                  <div className={`w-14 h-14 ${v.color} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4`}>{v.icon}</div>
                  <h3 className="font-black text-navy text-sm mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{v.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COACHING INDIVIDUEL ═══════════════════════════════════════════════ */}
      <section id="coaching-individuel" className="section bg-gray-50 overflow-hidden">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-14">
            <Reveal>
              <div>
                <Pill label="Pôle 1" icon={<span className="text-xs">👤</span>} />
                <h2 className="h2 mb-4">Coaching Professionnel<br /><span className="text-gradient">Personnalisé</span></h2>
                <p className="text-gray-600 leading-relaxed mb-6">Un accompagnement individuel sur mesure pour optimiser votre trajectoire et trouver votre plénitude professionnelle.</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {['Séances individuelles', '100% confidentiel', 'Résultats garantis'].map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100 text-gray-600 text-xs font-medium">
                      <CheckCircle size={12} className="text-green-500" />{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="relative aspect-square max-w-xs mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-navy/5 to-brand/5 rounded-3xl" />
                <div className="absolute inset-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-navy to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <TrendingUp size={28} className="text-white" />
                    </div>
                    <p className="font-black text-navy text-lg mb-1">Votre potentiel</p>
                    <p className="text-gray-500 text-sm">Révélé & amplifié</p>
                  </div>
                </div>
                {[
                  { label: 'Carrière',   style: { top: '4%',  left: '-6%'  }, delay: 0.8 },
                  { label: 'Équilibre', style: { top: '35%', right: '-8%' }, delay: 1.0 },
                  { label: 'Confiance', style: { bottom: '20%', left: '-6%' }, delay: 1.2 },
                  { label: 'Sérénité',  style: { bottom: '4%', right: '-4%' }, delay: 1.4 },
                ].map(chip => (
                  <motion.div key={chip.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: chip.delay, duration: 0.4 }}
                    style={chip.style as any}
                    className="absolute bg-white shadow-lg rounded-full px-3 py-1.5 text-xs font-bold text-navy border border-gray-100">
                    {chip.label}
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coachingIndividuel.map((item, i) => {
              const Icon = item.icon
              return (
                <Reveal key={item.theme} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 250 }}
                    className="card overflow-hidden h-full cursor-default">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${item.color}`} />
                    <div className="p-5">
                      <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-4 ${item.textColor}`}>
                        <Icon size={20} />
                      </div>
                      <h3 className="font-black text-navy text-sm mb-3">{item.theme}</h3>
                      <div className="mb-3">
                        <p className="text-[.6rem] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Résultats</p>
                        <ul className="space-y-1.5">{item.resultats.map(r => <Check key={r} text={r} />)}</ul>
                      </div>
                      {item.activites.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-[.6rem] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Méthodes</p>
                          <div className="flex flex-wrap gap-1">
                            {item.activites.map(a => (
                              <span key={a} className="text-[.65rem] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ COACHING COLLECTIF ════════════════════════════════════════════════ */}
      <section id="coaching-collectif" className="section bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="wrap relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <Pill label="Pôle 2" icon={<span className="text-xs">👥</span>} />
                <h2 className="h2 text-white mb-4">Leadership &<br /><span className="text-gradient">Synergie Collective</span></h2>
                <p className="text-white/60 leading-relaxed mb-8">Des interventions ciblées pour managers et responsables souhaitant transformer leur équipe en force vive.</p>
                <div className="flex items-center gap-6">
                  {[['4','modules'],['100%','opérationnel'],['↑','performance']].map(([val,lbl]) => (
                    <div key={lbl} className="text-center">
                      <div className="text-2xl font-black text-brand">{val}</div>
                      <div className="text-white/50 text-xs">{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coachingCollectif.map((item, i) => {
                const Icon = item.Icon
                return (
                  <Reveal key={item.theme} delay={i * 0.1}>
                    <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}
                      className="bg-white/8 border border-white/10 rounded-2xl p-5 cursor-default">
                      <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center text-brand mb-3">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-black text-white text-sm mb-2">{item.theme}</h3>
                      <p className="text-white/50 text-xs leading-relaxed">{item.resultats}</p>
                    </motion.div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ BILAN DE COMPÉTENCES ══════════════════════════════════════════════ */}
      <section id="bilan" className="section bg-white overflow-hidden">
        <div className="wrap">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Pill label="Pôle 3" icon={<Star size={12} />} />
              <h2 className="h2 mb-4">Bilan de Compétences<br /><span className="text-gradient">Votre Nouveau Départ</span></h2>
              <p className="text-gray-500 leading-relaxed">Transformez votre insatisfaction professionnelle en une stratégie de succès.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {[
              { tag: 'Cursus & Formation', icon: '📚', title: "Doute sur l'orientation",   text: 'Accompagnement stratégique vers un changement de filière cohérent.', bgCard: 'from-blue-50 to-indigo-50', border: 'border-blue-200', tagColor: 'text-blue-600 bg-blue-100' },
              { tag: 'Poste & Fonction',   icon: '💼', title: 'Inadéquation au poste',     text: "Identification des leviers pour un changement de poste ou de fonction réussi.", bgCard: 'from-violet-50 to-purple-50', border: 'border-violet-200', tagColor: 'text-violet-600 bg-violet-100' },
              { tag: 'Carrière',           icon: '🚀', title: 'Stagnation professionnelle',text: 'Déblocage des potentiels pour une évolution de carrière dynamique.',         bgCard: 'from-teal-50 to-cyan-50',   border: 'border-teal-200',   tagColor: 'text-teal-600 bg-teal-100' },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 250 }}
                  className={`card bg-gradient-to-b ${item.bgCard} to-white border ${item.border} p-6 h-full cursor-default`}>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <span className={`text-[.6rem] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full ${item.tagColor} mb-3 inline-block`}>{item.tag}</span>
                  <h3 className="font-black text-navy text-base mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed"><strong className="text-navy font-bold">Bénéfice : </strong>{item.text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="text-center mb-10">
              <h3 className="font-black text-navy text-2xl mb-2">Nos Packs <span className="text-gradient">« Signature »</span></h3>
              <p className="text-gray-500 text-sm">Choisissez la formule adaptée à votre situation</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packs.map((p, i) => (
              <Reveal key={p.key} delay={i * 0.1}>
                <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: 'spring', stiffness: 250 }}
                  className={`relative card overflow-hidden cursor-default ${p.featured ? `ring-2 ring-amber-200` : ''}`}
                  style={{ borderTop: `4px solid ${p.accent}` }}>
                  {p.featured && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[.6rem] font-extrabold uppercase tracking-widest bg-brand text-white px-2 py-0.5 rounded-full">Populaire</span>
                    </div>
                  )}
                  <div className="bg-navy px-5 py-5">
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <p className="font-black text-white text-base mb-0.5">{p.label}</p>
                    <p className="text-xs font-bold" style={{ color: p.accent }}>{p.tagline}</p>
                  </div>
                  <div className={`p-5 bg-gradient-to-b ${p.bg} to-white flex flex-col`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">{p.sessions}</span>
                    </div>
                    <p className="text-gray-500 text-sm italic mb-4 leading-relaxed">{p.desc}</p>
                    <div className="mb-4">
                      <p className="text-[.6rem] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Services inclus</p>
                      <ul className="space-y-1.5">{p.services.map(s => <Check key={s} text={s} />)}</ul>
                    </div>
                    <div className="mt-2 pt-4 border-t border-white/80">
                      <p className="text-[.6rem] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Résultat clé</p>
                      <div className="flex items-start gap-2">
                        <CheckCircle size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 font-medium">{p.resultat}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FORMATIONS ════════════════════════════════════════════════════════ */}
      <section id="formations" className="section bg-gray-50 overflow-hidden">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-14">
            <Reveal>
              <div>
                <Pill label="Pôle 4" icon={<span className="text-xs">📖</span>} />
                <h2 className="h2 mb-4">Formations Stratégiques<br /><span className="text-gradient">Spécifiques</span></h2>
                <p className="text-gray-600 leading-relaxed">Des programmes sur mesure pour entreprises, institutions et services publics. Conçus pour générer un impact immédiat et mesurable.</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-3 gap-3">
                {modalites.map((m, i) => (
                  <motion.div key={m.duree} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                    whileHover={{ y: -4 }} className="card p-4 text-center cursor-default">
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <p className="text-xl font-black text-brand">{m.duree}</p>
                    <p className="text-xs font-bold text-navy mb-2">{m.pack}</p>
                    <p className="text-gray-500 text-[0.65rem] leading-relaxed">{m.avantage}</p>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="space-y-4">
            {formations.map((f, i) => {
              const Icon = f.Icon
              return (
                <Reveal key={f.titre} delay={i * 0.12}>
                  <motion.div whileHover={{ x: 6 }} transition={{ type: 'spring', stiffness: 300 }}
                    className="card p-6 flex gap-6 items-start cursor-default">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${f.bgIcon} ${f.textColor} rounded-2xl flex items-center justify-center`}>
                        <Icon size={24} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-black text-navy">{f.titre}</h3>
                        <span className="text-2xl font-black text-gray-100 flex-shrink-0">{f.num}</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3">{f.impact}</p>
                      {f.livrables.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {f.livrables.map(l => (
                            <span key={l} className="inline-flex items-center gap-1.5 text-xs bg-brand/10 text-brand px-2.5 py-1 rounded-full font-medium">
                              <CheckCircle size={11} />{l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
          <Reveal delay={0.2}>
            <p className="text-gray-400 text-xs text-center mt-6">* Effectifs : 1 à 30 participants par session. Formations disponibles en présentiel à Lomé, Togo.</p>
          </Reveal>
        </div>
      </section>

      {/* ══ RÉFÉRENCES ════════════════════════════════════════════════════════ */}
      <section id="references" className="section bg-white overflow-hidden">
        <div className="wrap">
          <Reveal>
            <div className="text-center mb-14">
              <Pill label="Confiance" icon={<span className="text-xs">🏆</span>} />
              <h2 className="h2 mb-3">Ils Nous Font Confiance</h2>
              <p className="text-gray-500">Plus de <strong className="text-navy">40 structures partenaires</strong> au Togo et en Afrique de l'Ouest.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {refs.map((group, gi) => (
              <Reveal key={group.cat} delay={gi * 0.08}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 250 }}
                  className={`card border-t-4 ${group.color} p-5 h-full cursor-default`}>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-2xl">{group.icon}</span>
                    <h3 className="font-black text-navy text-xs uppercase tracking-widest leading-tight">{group.cat}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(item => (
                      <motion.span key={item} whileHover={{ scale: 1.05 }}
                        className="text-[.65rem] font-bold uppercase tracking-wider bg-gray-100 hover:bg-navy hover:text-white text-gray-600 px-2.5 py-1 rounded-lg cursor-default transition-colors duration-200">
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="bg-gradient-to-r from-navy to-[#1a3a7a] rounded-3xl p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { val: '+40', label: 'Structures partenaires', icon: '🤝' },
                { val: '+10 ans', label: "D'expertise",       icon: '⭐' },
                { val: '4',   label: 'Secteurs couverts',     icon: '🎯' },
                { val: '100%',label: 'Satisfaction clients',  icon: '💯' },
              ].map((k, i) => (
                <motion.div key={k.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                  <div className="text-2xl mb-1">{k.icon}</div>
                  <div className="text-3xl font-black text-white mb-1">{k.val}</div>
                  <div className="text-white/50 text-xs font-medium">{k.label}</div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════════════ */}
      <section className="section bg-gradient-to-br from-navy-deep via-navy to-[#1a3a7a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand/20 blur-3xl pointer-events-none" />
        <div className="wrap text-center relative z-10">
          <Reveal>
            <div className="max-w-2xl mx-auto">
              <div className="text-4xl mb-6">🚀</div>
              <h2 className="h2 text-white mb-4">Prêt à passer à <span className="text-gradient">l'étape supérieure ?</span></h2>
              <p className="text-white/60 leading-relaxed mb-8">Contactez-nous pour un diagnostic initial gratuit. Notre équipe d'experts est disponible pour construire ensemble votre trajectoire de succès.</p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Link to="/rendez-vous" className="btn-navy group">
                  Prendre Rendez-vous
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <WaButton className="btn-outline !border-white/30 !text-white hover:!bg-white/10" />
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-white/40 text-sm">
                {['Diagnostic gratuit', 'Sans engagement', '100% confidentiel'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-green-400" />{t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}