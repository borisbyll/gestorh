import { useState }     from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet }       from 'react-helmet-async'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import { z }            from 'zod'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { supabase }     from '@/lib/supabase'
import { sendEmail }    from '@/lib/sendEmail'
import { nanoid }       from '@/lib/utils'
import toast            from 'react-hot-toast'

const schema = z.object({
  nom:        z.string().min(2, 'Nom requis'),
  email:      z.string().email('Email invalide'),
  phone:      z.string().min(8, 'Téléphone requis'),
  profession: z.string().min(2, 'Profession requise'),
  password:   z.string().min(8, 'Minimum 8 caractères'),
  newsletter: z.boolean().optional(),
})
type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirectTo = params.get('redirect') || '/tests'
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema), defaultValues: { newsletter: true } })

  const onSubmit = async (data: Form) => {
    try {
      // Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options: {
          data:        { nom: data.nom },
          emailRedirectTo: `${window.location.origin}/tests?unlock=1`,
        },
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Erreur création compte')

      // Créer le profil
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id:         userId,
        nom:        data.nom,
        phone:      data.phone,
        profession: data.profession,
        newsletter: data.newsletter || false,
      })
      if (profileError) console.error('Profile error:', profileError)

      // Abonner à la newsletter si coché
      if (data.newsletter) {
        const token = nanoid(32)
        await supabase.from('newsletter_subscribers').upsert({
          email:     data.email,
          name:      data.nom,
          confirmed: true,
          token,
        }, { onConflict: 'email' })

        try {
          await sendEmail({
            type: 'newsletter_welcome',
            to:   data.email,
            data: {
              name:     data.nom,
              testsUrl: `${window.location.origin}/tests`,
            },
          })
        } catch { /* Email envoyé après confirmation */ }
      }

      // Sauvegarder l'email pour la page d'attente
      sessionStorage.setItem('pending_registration_email', data.email)

      // Vérifier si email confirmation est requise
const needsConfirmation = !authData.session

    if (needsConfirmation) {
    sessionStorage.setItem('pending_registration_email', data.email)
    toast.success('Compte créé ! Vérifiez votre email.')
    navigate('/confirmer-email')
    } else {
    toast.success('Compte créé avec succès !')
    navigate('/tests')
    }
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        toast.error('Cet email est déjà utilisé. Connectez-vous.')
        navigate(`/connexion?redirect=${redirectTo}`)
      } else {
        toast.error(err.message || 'Erreur lors de la création du compte')
      }
    }
  }

  return (
    <>
      <Helmet>
        <title>Créer un compte | GESTORH</title>
        <meta name="robots" content="noindex"/>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <Link to="/">
              <img src="/logo.png" alt="GESTORH" className="h-14 mx-auto mb-4"/>
            </Link>
            <h1 className="text-2xl font-black text-gray-900">Créer un compte</h1>
            <p className="text-gray-500 text-sm mt-1">
              Accédez à vos résultats de tests et à votre espace personnel
            </p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nom complet *</label>
                  <input {...register('nom')} className={`input ${errors.nom ? 'input-err' : ''}`} placeholder="Jean Kodjo"/>
                  {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom.message}</p>}
                </div>
                <div>
                  <label className="label">Profession *</label>
                  <input {...register('profession')} className={`input ${errors.profession ? 'input-err' : ''}`} placeholder="DRH"/>
                  {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession.message}</p>}
                </div>
              </div>

              <div>
                <label className="label">Email *</label>
                <input {...register('email')} type="email" className={`input ${errors.email ? 'input-err' : ''}`} placeholder="votre@email.com"/>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">WhatsApp / Téléphone *</label>
                <input {...register('phone')} type="tel" className={`input ${errors.phone ? 'input-err' : ''}`} placeholder="+228 XX XX XX XX"/>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="label">Mot de passe *</label>
                <div className="relative">
                  <input {...register('password')} type={showPwd ? 'text' : 'password'}
                    className={`input !pr-10 ${errors.password ? 'input-err' : ''}`}
                    placeholder="Minimum 8 caractères"/>
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <label className="flex items-start gap-3 p-4 bg-brand-light rounded-2xl cursor-pointer border-2 border-transparent hover:border-brand/30 transition-all">
                <input {...register('newsletter')} type="checkbox" className="w-4 h-4 accent-brand mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-sm font-bold text-gray-900">S'abonner à la newsletter GESTORH</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recevez chaque semaine nos conseils en RH, psychologie et bien-être.
                  </p>
                </div>
              </label>

              <button type="submit" disabled={isSubmitting} className="btn-navy w-full justify-center">
                {isSubmitting
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <UserPlus size={15}/>
                }
                Créer mon compte
              </button>

              <p className="text-xs text-gray-400 text-center">
                En créant un compte, vous acceptez nos conditions d'utilisation.
              </p>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Déjà un compte ?{' '}
            <Link to={`/connexion?redirect=${redirectTo}`} className="text-navy font-bold hover:underline">
              Se connecter
            </Link>
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: '🔍', label: 'Analyse complète' },
              { icon: '📧', label: 'Suivi personnalisé' },
              { icon: '🎯', label: 'Recommandations' },
            ].map(({ icon, label }) => (
              <div key={label} className="text-center p-3 bg-white rounded-2xl border border-gray-200">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-xs font-semibold text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}