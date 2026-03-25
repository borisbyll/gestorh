import { useState }     from 'react'
import { useForm }      from 'react-hook-form'
import { zodResolver }  from '@hookform/resolvers/zod'
import { z }            from 'zod'
import { Star, Send }   from 'lucide-react'
import { supabase }     from '@/lib/supabase'
import toast            from 'react-hot-toast'

const schema = z.object({
  author_name: z.string().min(2, 'Nom requis'),
  author_role: z.string().min(2, 'Poste/Ville requis'),
  service:     z.string().min(1, 'Choisissez un service'),
  content:     z.string().min(20, 'Minimum 20 caractères'),
  rating:      z.number().min(1).max(5),
})
type Form = z.infer<typeof schema>

export default function ReviewForm({ onDone }: { onDone?: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover,  setHover]  = useState(0)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<Form>({ resolver: zodResolver(schema), defaultValues: { rating: 0 } })

  const onSubmit = async (data: Form) => {
    try {
      const { error } = await supabase.from('reviews').insert({ ...data, approved: false })
      if (error) throw error
      toast.success('Merci ! Votre avis sera publié après modération.')
      onDone?.()
    } catch {
      toast.error('Erreur lors de l\'envoi. Réessayez.')
    }
  }

  const setR = (v: number) => {
    setRating(v)
    setValue('rating', v, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

      {/* Étoiles */}
      <div>
        <label className="label">Votre note *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button"
              onClick={() => setR(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110 focus-visible:outline-none">
              <Star size={28} className={n <= (hover || rating)
                ? 'text-brand fill-brand'
                : 'text-gray-300 fill-gray-100'}/>
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-red-500 text-xs mt-1">Choisissez une note</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nom complet *</label>
          <input {...register('author_name')} className={`input ${errors.author_name ? 'input-err' : ''}`} placeholder="Jean Kodjo"/>
          {errors.author_name && <p className="text-red-500 text-xs mt-1">{errors.author_name.message}</p>}
        </div>
        <div>
          <label className="label">Poste / Ville *</label>
          <input {...register('author_role')} className={`input ${errors.author_role ? 'input-err' : ''}`} placeholder="DRH — Lomé"/>
          {errors.author_role && <p className="text-red-500 text-xs mt-1">{errors.author_role.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Service *</label>
        <select {...register('service')} className={`input ${errors.service ? 'input-err' : ''}`}>
          <option value="">Choisir…</option>
          <option>Solutions RH</option>
          <option>Coaching Pro</option>
          <option>Psychologie</option>
          <option>Thérapie de couple</option>
          <option>Tests & Bilans</option>
        </select>
        {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service.message}</p>}
      </div>

      <div>
        <label className="label">Votre témoignage *</label>
        <textarea {...register('content')} rows={4}
          className={`input resize-none ${errors.content ? 'input-err' : ''}`}
          placeholder="Partagez votre expérience avec GESTORH…"/>
        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-navy w-full justify-center">
        {isSubmitting
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          : <Send size={15}/>
        }
        Soumettre mon avis
      </button>
      <p className="text-xs text-gray-400 text-center">
        Votre avis sera publié après validation par notre équipe.
      </p>
    </form>
  )
}