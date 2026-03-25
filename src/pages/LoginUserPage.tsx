import { useState }    from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet }      from 'react-helmet-async'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { supabase }    from '@/lib/supabase'
import toast           from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})
type Form = z.infer<typeof schema>

export default function LoginUserPage() {
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const redirectTo = params.get('redirect') || '/tests'
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email:    data.email,
        password: data.password,
      })
      if (error) throw error
      toast.success('Bienvenue !')
      navigate(redirectTo)
    } catch {
      toast.error('Email ou mot de passe incorrect.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Connexion | GESTORH</title>
        <meta name="robots" content="noindex"/>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/">
              <img src="/logo.png" alt="GESTORH" className="h-14 mx-auto mb-4"/>
            </Link>
            <h1 className="text-2xl font-black text-gray-900">Se connecter</h1>
            <p className="text-gray-500 text-sm mt-1">
              Accédez à vos résultats et à votre espace personnel
            </p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              <div>
                <label className="label">Email *</label>
                <input {...register('email')} type="email"
                  className={`input ${errors.email ? 'input-err' : ''}`}
                  placeholder="votre@email.com"/>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Mot de passe *</label>
                <div className="relative">
                  <input {...register('password')} type={showPwd ? 'text' : 'password'}
                    className={`input !pr-10 ${errors.password ? 'input-err' : ''}`}
                    placeholder="••••••••"/>
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-navy w-full justify-center">
                {isSubmitting
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <LogIn size={15}/>
                }
                Se connecter
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Pas encore de compte ?{' '}
            <Link to={`/inscription?redirect=${redirectTo}`} className="text-navy font-bold hover:underline">
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}