import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import { Helmet }              from 'react-helmet-async'
import { motion }              from 'framer-motion'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { supabase }            from '@/lib/supabase'
import toast                   from 'react-hot-toast'

export default function ConfirmEmailPage() {
  const navigate = useNavigate()
  const [checking,  setChecking]  = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [email,     setEmail]     = useState('')

  useEffect(() => {
    // Récupérer l'email depuis sessionStorage
    const stored = sessionStorage.getItem('pending_registration_email')
    if (stored) setEmail(stored)

    // Vérifier si déjà confirmé (cas où l'utilisateur revient après clic sur le lien)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email_confirmed_at) {
        handleConfirmed()
      }
    })

    // Écouter les changements d'auth (confirmation email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        handleConfirmed()
      }
      if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
        handleConfirmed()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleConfirmed = async () => {
    setConfirmed(true)

    // Récupérer le résultat de test en attente
    const pendingResult = sessionStorage.getItem('pending_test_result')

    if (pendingResult) {
      sessionStorage.removeItem('pending_test_result')
      sessionStorage.removeItem('pending_registration_email')
      // Rediriger vers les tests avec un flag pour débloquer automatiquement
      setTimeout(() => navigate('/tests?unlock=1'), 1500)
    } else {
      setTimeout(() => navigate('/tests'), 1500)
    }
  }

  const checkConfirmation = async () => {
    setChecking(true)
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user?.email_confirmed_at) {
        await handleConfirmed()
      } else {
        // Rafraîchir la session
        const { data: refreshData } = await supabase.auth.refreshSession()
        if (refreshData.session?.user?.email_confirmed_at) {
          await handleConfirmed()
        } else {
          toast('Email pas encore confirmé. Vérifiez votre boîte mail.')
        }
      }
    } finally {
      setChecking(false)
    }
  }

  const resendEmail = async () => {
    if (!email) return
    try {
      const { error } = await supabase.auth.resend({
        type:  'signup',
        email: email,
      })
      if (error) throw error
      toast.success('Email de confirmation renvoyé !')
    } catch {
      toast.error('Erreur lors de l\'envoi')
    }
  }

  if (confirmed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: .9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card p-12 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600"/>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Email confirmé !</h2>
        <p className="text-gray-500">Redirection vers vos résultats...</p>
        <div className="mt-4 flex justify-center">
          <span className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
        </div>
      </motion.div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>Confirmez votre email | GESTORH</title>
        <meta name="robots" content="noindex"/>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md">

          <div className="card p-10 text-center">
            {/* Icône animée */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-6">
              <Mail size={36} className="text-navy"/>
            </motion.div>

            <h1 className="text-2xl font-black text-gray-900 mb-3">
              Vérifiez votre email
            </h1>

            <p className="text-gray-500 mb-2">
              Un email de confirmation a été envoyé à
            </p>
            {email && (
              <p className="font-bold text-navy mb-6">{email}</p>
            )}

            <div className="bg-blue-soft rounded-2xl p-5 mb-6 text-left">
              <p className="text-xs font-extrabold tracking-widest uppercase text-navy mb-3">
                Étapes à suivre
              </p>
              <div className="space-y-2">
                {[
                  'Ouvrez votre boîte mail',
                  'Cherchez l\'email de GESTORH',
                  'Cliquez sur le lien de confirmation',
                  'Vous serez automatiquement redirigé',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[.6rem] font-black">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={checkConfirmation}
              disabled={checking}
              className="btn-navy w-full justify-center mb-3">
              {checking
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <RefreshCw size={15}/>
              }
              J'ai confirmé mon email
            </button>

            <button
              onClick={resendEmail}
              className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-navy transition-colors">
              Renvoyer l'email de confirmation
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Vérifiez aussi votre dossier spam si vous ne trouvez pas l'email.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}