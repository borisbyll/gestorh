import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UnsubscribePage() {
  const [params]  = useSearchParams()
  const [status,  setStatus]  = useState<'loading'|'success'|'error'>('loading')
  const email = params.get('email')

  useEffect(() => {
    if (!email) { setStatus('error'); return }
    supabase.from('newsletter_subscribers')
      .delete()
      .eq('email', email)
      .then(({ error }) => setStatus(error ? 'error' : 'success'))
  }, [email])

  return (
    <>
      <Helmet>
        <title>Désabonnement | GESTORH</title>
        <meta name="robots" content="noindex"/>
      </Helmet>
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="card p-12 max-w-md text-center">
          {status === 'loading' && (
            <div className="w-10 h-10 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto"/>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <Check size={28} className="text-green-600"/>
              </div>
              <h1 className="h3 mb-3">Désabonnement confirmé</h1>
              <p className="text-gray-500 text-sm mb-6">
                L'adresse <strong>{email}</strong> a été supprimée de notre liste.
              </p>
              <Link to="/" className="btn-navy mx-auto">Retour à l'accueil</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <X size={28} className="text-red-500"/>
              </div>
              <h1 className="h3 mb-3">Erreur</h1>
              <p className="text-gray-500 text-sm mb-6">Email introuvable ou lien invalide.</p>
              <Link to="/" className="btn-navy mx-auto">Retour à l'accueil</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}