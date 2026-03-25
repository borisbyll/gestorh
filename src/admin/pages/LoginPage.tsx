import { useState }    from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm }     from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }           from 'zod'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { supabase }    from '@/lib/supabase'
import toast           from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe requis'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
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
      toast.success('Connexion réussie !')
      navigate('/admin')
    } catch {
      toast.error('Email ou mot de passe incorrect.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GESTORH" className="h-14 mx-auto mb-4"/>
          <h1 className="text-2xl font-black text-gray-900">Espace Administration</h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous pour gérer votre site</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input {...register('email')} type="email"
                  className={`input !pl-10 ${errors.email ? 'input-err' : ''}`}
                  placeholder="admin@gestorh.tg"/>
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input {...register('password')} type={showPwd ? 'text' : 'password'}
                  className={`input !pl-10 !pr-10 ${errors.password ? 'input-err' : ''}`}
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
                : <Lock size={15}/>
              }
              Se connecter
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Accès réservé à l'équipe GESTORH
        </p>
      </div>
    </div>
  )
}