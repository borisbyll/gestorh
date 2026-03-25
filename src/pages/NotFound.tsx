import { Link }  from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page introuvable | GESTORH</title>
        <meta name="robots" content="noindex"/>
      </Helmet>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="text-[8rem] font-black text-gray-100 leading-none mb-4 select-none">
          404
        </div>
        <h1 className="h2 mb-3">Page introuvable</h1>
        <p className="text-gray-500 max-w-sm mb-10">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn-navy"><Home size={15}/> Accueil</Link>
          <button onClick={() => window.history.back()} className="btn-outline">
            <ArrowLeft size={15}/> Retour
          </button>
        </div>
      </div>
    </>
  )
}