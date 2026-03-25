import { useState, useEffect } from 'react'
import { motion }              from 'framer-motion'
import { useNavigate }         from 'react-router-dom'
import { X, Lock, Star, LogIn, UserPlus } from 'lucide-react'
import { supabase }            from '@/lib/supabase'

interface TestResult {
  pct:       number
  testKey:   string
  testTitle: string
  testCat:   string
  testIcon:  string
  resName:   string
  resLevel:  'danger' | 'warning' | 'success'
  advice:    string
  actions:   string[]
  cta:       string
  score:     number
  maxScore:  number
}

interface Props {
  result:  TestResult
  onClose: () => void
  onDone:  (email: string) => void
}

const LEVEL_COLORS = {
  danger:  { text: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'bg-red-500'   },
  warning: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
  success: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' },
}

export default function TestLeadModal({ result, onClose, onDone }: Props) {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checking,  setChecking]  = useState(true)
  const c = LEVEL_COLORS[result.resLevel]

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setUserEmail(data.session.user.email)
      }
      setChecking(false)
    })
  }, [])

  // Si connecté → débloquer directement
  const unlockForConnectedUser = async () => {
    if (!userEmail) return
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('nom, phone, profession')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      await supabase.from('test_leads').insert({
        nom:          profile?.nom        || userEmail,
        email:        userEmail,
        phone:        profile?.phone      || '',
        profession:   profile?.profession || '',
        test_key:     result.testKey,
        test_title:   result.testTitle,
        score:        result.score,
        max_score:    result.maxScore,
        percent:      result.pct,
        result_name:  result.resName,
        result_level: result.resLevel,
        advice:       result.advice,
        cta:          result.cta,
        rdv_offered:  result.resLevel === 'danger',
      })

      // Email résultats
      await supabase.functions.invoke('send-email', {
        body: JSON.stringify({
          type: 'test_results',
          to:   userEmail,
          data: {
            nom:        profile?.nom || userEmail,
            testTitle:  result.testTitle,
            testIcon:   result.testIcon,
            score:      String(result.pct),
            resName:    result.resName,
            resLevel:   result.resLevel,
            advice:     result.advice,
            actions:    result.actions.join('||'),
            cta:        result.cta,
            rdvOffered: result.resLevel === 'danger' ? 'true' : 'false',
          },
        }),
      })

      // Alerte admin si critique
      if (result.resLevel === 'danger') {
        await supabase.functions.invoke('send-email', {
          body: JSON.stringify({
            type: 'test_alert_admin',
            to:   'contact@gestorh.tg',
            data: {
              nom:        profile?.nom        || userEmail,
              email:      userEmail,
              phone:      profile?.phone      || '-',
              profession: profile?.profession || '-',
              testTitle:  result.testTitle,
              score:      String(result.pct),
              resName:    result.resName,
            },
          }),
        })
      }

      onDone(userEmail)
    } catch {
      onDone(userEmail)
    }
  }

  // Sauvegarder le test en session et rediriger vers inscription/connexion
  const redirectToAuth = (page: 'inscription' | 'connexion') => {
    // Sauvegarder le résultat en sessionStorage pour récupérer après connexion
    sessionStorage.setItem('pending_test_result', JSON.stringify(result))
    navigate(`/${page}?redirect=/tests`)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: .9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: .9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-navy px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-bold tracking-widest uppercase">{result.testTitle}</p>
            <h2 className="text-white font-black text-lg mt-0.5">Vos résultats</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors">
            <X size={16}/>
          </button>
        </div>

        <div className="p-6">
          {/* Score visible */}
          <div className={`rounded-2xl p-5 border-2 ${c.border} ${c.bg} mb-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black text-gray-900">{result.resName}</span>
              <span className={`text-3xl font-black ${c.text}`}>{result.pct}%</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${c.bar}`}
              />
            </div>
          </div>

          {/* Aperçu flou */}
          <div className="relative mb-5">
            <div className="blur-sm select-none pointer-events-none">
              <div className={`p-4 rounded-2xl ${c.bg} border ${c.border} mb-3`}>
                <p className="text-sm text-gray-700">{result.advice}</p>
              </div>
              <div className="space-y-2">
                {result.actions.slice(0, 2).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-4 h-4 rounded-full ${c.bar} flex-shrink-0`}/>
                    <p className="text-xs text-gray-600">{a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-gray-200 mx-4">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-3">
                  <Lock size={18} className="text-navy"/>
                </div>
                <p className="font-black text-gray-900 text-sm mb-1">Analyse complète disponible</p>
                <p className="text-gray-500 text-xs">Connectez-vous pour débloquer</p>
              </div>
            </div>
          </div>

          {/* Ce qu'ils reçoivent */}
          <div className="bg-brand-light rounded-2xl p-4 mb-5">
            <p className="text-xs font-extrabold tracking-widest uppercase text-brand-dark mb-3">
              Ce que vous recevrez gratuitement
            </p>
            <div className="space-y-2">
              {[
                'Analyse experte détaillée de vos résultats',
                '4 recommandations personnalisées par nos experts',
                result.resLevel === 'danger' ? '🎁 Consultation offerte (score critique détecté)' : "Plan d'action pour améliorer votre situation",
                'Séquence de conseils sur 7 jours par email',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Star size={12} className="text-brand flex-shrink-0"/>
                  <p className="text-xs text-gray-700 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {result.resLevel === 'danger' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
              <p className="text-red-700 text-xs font-extrabold tracking-widest uppercase mb-1">⚠️ Score Critique Détecté</p>
              <p className="text-red-600 text-sm font-semibold">
                Une consultation gratuite vous est offerte. Nos experts vous contacteront dans les 24h.
              </p>
            </div>
          )}

          {checking ? (
            <div className="flex justify-center py-4">
              <span className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : userEmail ? (
            /* Utilisateur connecté → débloquer directement */
            <div>
              <div className="bg-blue-soft rounded-2xl p-4 mb-4 text-center">
                <p className="text-navy font-bold text-sm">Connecté en tant que</p>
                <p className="text-blue font-semibold text-sm">{userEmail}</p>
              </div>
              <button onClick={unlockForConnectedUser} className="btn-navy w-full justify-center">
                Débloquer mon analyse complète
              </button>
            </div>
          ) : (
            /* Non connecté → inscription ou connexion */
            <div className="space-y-3">
              <button onClick={() => redirectToAuth('inscription')}
                className="btn-navy w-full justify-center">
                <UserPlus size={15}/> Créer un compte gratuit
              </button>
              <button onClick={() => redirectToAuth('connexion')}
                className="btn-outline w-full justify-center">
                <LogIn size={15}/> Déjà un compte ? Se connecter
              </button>
              <p className="text-xs text-gray-400 text-center">
                Gratuit · Confidentiel · Sans engagement
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}