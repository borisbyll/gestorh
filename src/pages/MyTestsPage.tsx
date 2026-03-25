import { useState, useEffect } from 'react'
import { Helmet }              from 'react-helmet-async'
import { motion }              from 'framer-motion'
import { Link }                from 'react-router-dom'
import { ArrowRight, Calendar, TrendingUp, Award, LogIn } from 'lucide-react'
import { supabase }            from '@/lib/supabase'
import { formatDate }          from '@/lib/utils'

interface TestLead {
  id:           string
  created_at:   string
  test_key:     string
  test_title:   string
  score:        number
  max_score:    number
  percent:      number
  result_name:  string
  result_level: 'danger' | 'warning' | 'success'
  advice:       string
  cta:          string
}

const LEVEL_STYLES = {
  danger:  { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-600',   badge: 'bg-red-100 text-red-700',   bar: 'bg-red-500',   icon: '🚨', label: 'Critique'  },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', icon: '⚠️', label: 'Modéré'   },
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', icon: '✅', label: 'Positif'  },
}

const TEST_ICONS: Record<string, string> = {
  burnout:          '🔥',
  anxiety:          '🧘',
  selfesteem:       '💎',
  eq:               '🧠',
  leadership:       '🎯',
  org_performance:  '📊',
  team:             '👥',
  ikigai:           '🧭',
  couple:           '💑',
  resilience:       '💪',
}

export default function MyTestsPage() {
  const [tests,   setTests]   = useState<TestLead[]>([])
  const [loading, setLoading] = useState(true)
  const [user,    setUser]    = useState<{ email: string; nom?: string } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('nom')
        .eq('id', data.session.user.id)
        .single()

      setUser({ email: data.session.user.email || '', nom: profile?.nom })

      const { data: leads } = await supabase
        .from('test_leads')
        .select('*')
        .eq('email', data.session.user.email)
        .order('created_at', { ascending: false })

      setTests(leads || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="card p-12 max-w-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-black text-gray-900 mb-3">Connexion requise</h2>
        <p className="text-gray-500 text-sm mb-6">
          Connectez-vous pour accéder à vos résultats de tests.
        </p>
        <Link to="/connexion?redirect=/mes-tests" className="btn-navy justify-center w-full">
          <LogIn size={15}/> Se connecter
        </Link>
      </div>
    </div>
  )

  // Stats globales
  const avgScore   = tests.length > 0 ? Math.round(tests.reduce((a, t) => a + t.percent, 0) / tests.length) : 0
  const critCount  = tests.filter(t => t.result_level === 'danger').length
  const bestTest   = tests.reduce((best, t) => t.percent > (best?.percent || 0) ? t : best, tests[0])

  return (
    <>
      <Helmet>
        <title>Mes Tests | GESTORH</title>
        <meta name="robots" content="noindex"/>
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-br from-navy-deep to-navy py-20 px-5">
        <div className="wrap max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-xl">
              {(user.nom || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white/50 text-xs font-bold tracking-widest uppercase">Mon espace</p>
              <h1 className="text-2xl font-black text-white">{user.nom || user.email}</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="wrap py-12 max-w-4xl">

        {/* Stats */}
        {tests.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Tests passés',    value: tests.length,     icon: '📋', color: 'text-blue-600'   },
              { label: 'Score moyen',     value: avgScore + '%',   icon: '📊', color: 'text-navy'       },
              { label: 'Cas critiques',   value: critCount,        icon: '🚨', color: 'text-red-600'    },
              { label: 'Meilleur score',  value: bestTest ? bestTest.percent + '%' : '-', icon: '🏆', color: 'text-green-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card p-5 text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Liste des tests */}
        {tests.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-5">📋</div>
            <h2 className="text-xl font-black text-gray-900 mb-3">Aucun test passé</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              Découvrez nos diagnostics psychologiques gratuits et obtenez des recommandations personnalisées.
            </p>
            <Link to="/tests" className="btn-navy justify-center inline-flex">
              Découvrir les tests <ArrowRight size={15}/>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Mes résultats</h2>
              <Link to="/tests" className="btn-outline btn-sm">
                Faire un nouveau test <ArrowRight size={13}/>
              </Link>
            </div>

            <div className="space-y-4">
              {tests.map((test, i) => {
                const s = LEVEL_STYLES[test.result_level]
                const isOpen = expanded === test.id
                return (
                  <motion.div key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * .05 }}
                    className={`card overflow-hidden border-2 ${isOpen ? s.border : 'border-gray-100'}`}>

                    {/* Header */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : test.id)}
                      className="w-full p-5 text-left">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                            {TEST_ICONS[test.test_key] || '📊'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[.65rem] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${s.badge}`}>
                                {s.icon} {s.label}
                              </span>
                            </div>
                            <h3 className="font-black text-gray-900 text-sm">{test.test_title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={10}/> {formatDate(test.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp size={10}/> {test.result_name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-3xl font-black ${s.text}`}>{test.percent}%</div>
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${test.percent}%` }}/>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Détails expandables */}
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-5 border-t border-gray-100">

                        <div className={`p-4 rounded-2xl ${s.bg} border-l-4 ${s.border} mt-4 mb-4`}>
                          <p className={`text-xs font-extrabold tracking-widest uppercase mb-2 ${s.text}`}>
                            Analyse GESTORH
                          </p>
                          <p className="text-gray-800 text-sm leading-relaxed">{test.advice}</p>
                        </div>

                        {/* Barre de score détaillée */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-gray-500">Score obtenu</span>
                            <span className={s.text}>{test.score} / {test.max_score} points</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${test.percent}%` }}
                              transition={{ duration: .8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${s.bar}`}/>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex gap-3">
                          <Link to="/rendez-vous"
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-mid transition-colors">
                            <Award size={14}/> {test.cta}
                          </Link>
                          <Link to="/tests"
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-navy hover:text-navy transition-colors">
                            Refaire
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </>
        )}

        {/* Encouragement */}
        {tests.length > 0 && (
          <div className="mt-10 card p-6 bg-gradient-to-r from-navy to-blue-700 text-white text-center">
            <h3 className="font-black text-lg mb-2">Prêt(e) à aller plus loin ?</h3>
            <p className="text-white/70 text-sm mb-5">
              Nos experts peuvent vous accompagner personnellement sur la base de vos résultats.
            </p>
            <Link to="/rendez-vous" className="inline-flex items-center gap-2 bg-white text-navy font-black px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors">
              Prendre rendez-vous <ArrowRight size={14}/>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}