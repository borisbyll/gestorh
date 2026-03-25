import { useState }      from 'react'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { Send, Check }   from 'lucide-react'
import { supabase }      from '@/lib/supabase'
import { sendEmail }     from '@/lib/sendEmail'
import { nanoid, cn }    from '@/lib/utils'
import toast             from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Email invalide'),
})
type Form = z.infer<typeof schema>

export default function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [done, setDone] = useState(false)
  const [msg,  setMsg]  = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    try {
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, confirmed')
        .eq('email', data.email)
        .maybeSingle()

      if (existing?.confirmed) {
        setMsg('Vous êtes déjà inscrit(e) à notre newsletter !')
        setDone(true)
        return
      }

      if (existing && !existing.confirmed) {
        setMsg('Vous êtes déjà inscrit(e). Vérifiez votre boîte mail.')
        setDone(true)
        return
      }

      const token = nanoid(32)
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: data.email, confirmed: true, token })
      if (error) throw error

      await sendEmail({
        type: 'newsletter_welcome',
        to:   data.email,
        data: {
          name:     '',
          testsUrl: `${window.location.origin}/tests`,
        },
      })

      setMsg('Bienvenue ! Un email de bienvenue vous a été envoyé.')
      setDone(true)
      toast.success('Inscription réussie !')
    } catch (err: any) {
      console.error(err)
      toast.error('Erreur. Veuillez réessayer.')
    }
  }

  if (done) {
    return (
      <div className={cn('flex items-start gap-3 text-sm font-semibold', dark ? 'text-white' : 'text-navy')}>
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Check size={16} className="text-white"/>
        </div>
        <span>{msg}</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            {...register('email')}
            type="email"
            placeholder="votre@email.com"
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium outline-none transition-all',
              dark
                ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-white/60'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-navy'
            )}
          />
          {errors.email && (
            <p className={cn('text-xs mt-1.5', dark ? 'text-red-300' : 'text-red-500')}>
              {errors.email.message}
            </p>
          )}
        </div>
        <button type="submit" disabled={isSubmitting}
          className="btn-orange flex-shrink-0 disabled:opacity-60 justify-center">
          {isSubmitting
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : <Send size={15}/>
          }
          S'inscrire
        </button>
      </div>
      <p className={cn('text-xs mt-3', dark ? 'text-white/35' : 'text-gray-400')}>
        Pas de spam. Désinscription gratuite à tout moment.
      </p>
    </form>
  )
}