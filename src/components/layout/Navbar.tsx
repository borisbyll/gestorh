import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate }   from 'react-router-dom'
import { motion, AnimatePresence }      from 'framer-motion'
import { Menu, X, CalendarCheck, LogIn, LogOut, User, ChevronDown, Sparkles, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn }       from '@/lib/utils'
import toast        from 'react-hot-toast'

const LINKS = [
  { to: '/',             label: 'Accueil' },
  { to: '/tests',        label: 'Tests',    highlight: true },
  { to: '/blog',         label: 'Blog' },
  { to: '/offres',         label: 'Nos offres' },
  { to: '/#expertises',  label: 'Expertises' },
  { to: '/#temoignages', label: 'Avis' },
  { to: '/contact',      label: 'Contact' },
]

export default function Navbar() {
  const navigate  = useNavigate()
  const [scrolled,  setScrolled]  = useState(false)
  const [open,      setOpen]      = useState(false)
  const [user,      setUser]      = useState<{ email: string; nom?: string } | null>(null)
  const [showMenu,  setShowMenu]  = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles').select('nom').eq('id', data.session.user.id).single()
        setUser({ email: data.session.user.email || '', nom: profile?.nom })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles').select('nom').eq('id', session.user.id).single()
        setUser({ email: session.user.email || '', nom: profile?.nom })
      } else { setUser(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleAnchorClick = (e: React.MouseEvent, to: string) => {
    if (to.includes('#')) {
      e.preventDefault()
      const id = to.split('#')[1]
      if (window.location.pathname !== '/') {
        navigate('/')
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300)
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
      setOpen(false)
      setShowMenu(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setShowMenu(false)
    toast.success('À bientôt !')
    navigate('/')
  }

  const initials = user ? (user.nom || user.email).charAt(0).toUpperCase() : ''

  return (
    <>
      {/* ══ TOP BAR ══ */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: scrolled ? -40 : 0 }}
        transition={{ duration: .4, ease: 'easeInOut' }}
        className="fixed inset-x-0 top-0 z-[901] h-10 bg-navy border-b border-white/5">
        <div className="wrap h-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/40 text-[.65rem] font-semibold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
            Cabinet ouvert · Lomé, Togo
          </div>
          <a href="tel:+22898912369"
            className="flex items-center gap-1.5 text-white/40 text-[.65rem] font-semibold hover:text-white/70 transition-colors">
            <Phone size={10}/> +228 98 91 23 69
          </a>
        </div>
      </motion.div>

      {/* ══ NAVBAR FLOTTANTE ══ */}
      <motion.header
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: .6, ease: [.16, 1, .3, 1], delay: .1 }}
        className={cn(
          'fixed inset-x-0 z-[900] flex justify-center px-5 transition-all duration-500',
          scrolled ? 'top-3' : 'top-14'
        )}>
        <div className={cn(
          'w-full max-w-[1100px] flex items-center justify-between gap-4 transition-all duration-500',
          'rounded-2xl border px-4 h-[60px]',
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-gray-200/80 shadow-[0_8px_32px_rgba(15,37,87,.12)]'
            : 'bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-[0_8px_32px_rgba(15,37,87,.08)]'
        )}>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label="GESTORH">
            <img src="/logo.png" alt="GESTORH" className="h-16 w-auto transition-all duration-300"/>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}
                onClick={(e) => handleAnchorClick(e, l.to)}
                className={({ isActive }) => cn(
                  'relative px-3.5 py-2 text-[.8rem] font-semibold rounded-xl transition-all duration-200 whitespace-nowrap',
                  l.highlight
                    ? 'font-extrabold flex items-center gap-1.5 text-brand-dark bg-brand/10 hover:bg-brand/15 border border-brand/20'
                    : isActive && !l.to.includes('#')
                    ? 'text-navy font-bold bg-navy/8'
                    : 'text-gray-600 hover:text-navy hover:bg-gray-100/70'
                )}>
                {l.highlight && <Sparkles size={11}/>}
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">

            {/* CTA RDV */}
            <Link to="/rendez-vous"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[.8rem] font-bold bg-navy text-white shadow-[0_4px_14px_rgba(15,37,87,.25)] hover:shadow-[0_6px_20px_rgba(15,37,87,.3)] hover:-translate-y-0.5 transition-all duration-200">
              <CalendarCheck size={14}/> RDV
            </Link>

            {/* User / Login */}
            {user ? (
              <div className="relative">
                <button onClick={() => setShowMenu(v => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-navy transition-all duration-200">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-navy to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                    {initials}
                  </div>
                  <span className="text-[.75rem] font-bold max-w-[70px] truncate text-gray-800">
                    {user.nom || user.email.split('@')[0]}
                  </span>
                  <ChevronDown size={12} className={cn('transition-transform text-gray-400', showMenu && 'rotate-180')}/>
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}/>
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: .95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: .95 }}
                        transition={{ duration: .15 }}
                        className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,.13)] border border-gray-100 overflow-hidden z-20">
                        <div className="p-3 bg-gradient-to-r from-navy to-blue-700 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-black">{initials}</div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-bold truncate">{user.nom || 'Mon compte'}</p>
                            <p className="text-white/50 text-xs truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          <Link to="/mes-tests" onClick={() => setShowMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-navy transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-blue-soft flex items-center justify-center">
                              <User size={13} className="text-navy"/>
                            </div>
                            Mes tests
                          </Link>
                          <Link to="/rendez-vous" onClick={() => setShowMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-navy transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-blue-soft flex items-center justify-center">
                              <CalendarCheck size={13} className="text-navy"/>
                            </div>
                            Prendre RDV
                          </Link>
                        </div>
                        <div className="p-1.5 border-t border-gray-100">
                          <button onClick={logout}
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                              <LogOut size={13} className="text-red-500"/>
                            </div>
                            Se déconnecter
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/connexion"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[.8rem] font-bold border border-gray-200 text-gray-700 hover:border-navy hover:text-navy bg-white transition-all duration-200">
                <LogIn size={13}/> Connexion
              </Link>
            )}
          </div>

          {/* Burger */}
          <button onClick={() => setOpen(v => !v)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-navy hover:bg-gray-100 transition-all">
            <AnimatePresence mode="wait">
              <motion.div key={open ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: .15 }}>
                {open ? <X size={20}/> : <Menu size={20}/>}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* ══ MOBILE MENU ══ */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[898] bg-navy/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="fixed bottom-0 inset-x-0 z-[899] bg-white rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,.15)] overflow-hidden">

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200"/>
              </div>

              {/* User info */}
              {user ? (
                <div className="mx-4 mt-2 mb-4 flex items-center gap-3 bg-navy rounded-2xl p-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black flex-shrink-0">{initials}</div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{user.nom || 'Mon compte'}</p>
                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="mx-4 mt-2 mb-4 flex gap-2">
                  <Link to="/connexion" onClick={() => setOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-navy text-sm font-bold">
                    <LogIn size={14}/> Connexion
                  </Link>
                  <Link to="/inscription" onClick={() => setOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-navy text-white text-sm font-bold">
                    <User size={14}/> S'inscrire
                  </Link>
                </div>
              )}

              {/* Links grid */}
              <div className="px-4 grid grid-cols-2 gap-2 mb-4">
                {LINKS.map((l, i) => (
                  <motion.div key={l.to}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * .04 }}>
                    <Link to={l.to} onClick={(e) => { handleAnchorClick(e, l.to); setOpen(false) }}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors',
                        l.highlight
                          ? 'bg-brand/10 text-brand-dark font-extrabold border border-brand/20'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-navy'
                      )}>
                      {l.highlight && <Sparkles size={12}/>}
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
                {user && (
                  <Link to="/mes-tests" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-navy transition-colors">
                    <User size={13}/> Mes tests
                  </Link>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pb-8 space-y-2 border-t border-gray-100 pt-3">
                <Link to="/rendez-vous" onClick={() => setOpen(false)}
                  className="btn-navy w-full justify-center">
                  <CalendarCheck size={15}/> Prendre rendez-vous
                </Link>
                {user && (
                  <button onClick={() => { logout(); setOpen(false) }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-red-500 text-sm font-bold hover:bg-red-50 transition-colors">
                    <LogOut size={14}/> Se déconnecter
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}