import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Calendar,
  MessageSquare, Star, Mail, TrendingUp,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn }       from '@/lib/utils'
import toast        from 'react-hot-toast'

interface NavItem {
  to:     string
  label:  string
  icon:   React.ElementType
  exact?: boolean
  badge?: number
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const [open,   setOpen]   = useState(false)
  const [email,  setEmail]  = useState('')
  const [badges, setBadges] = useState({
    rdv:      0,
    contacts: 0,
    avis:     0,
    leads:    0,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/admin/login'); return }
      setEmail(data.user.email || '')
    })
  }, [navigate])

  useEffect(() => {
    const loadBadges = async () => {
      const [rdvRes, contactsRes, avisRes, leadsRes] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('approved', false),
        supabase.from('test_leads').select('*', { count: 'exact', head: true }).eq('converted', false).eq('result_level', 'danger'),
      ])
      setBadges({
        rdv:      rdvRes.count      || 0,
        contacts: contactsRes.count || 0,
        avis:     avisRes.count     || 0,
        leads:    leadsRes.count    || 0,
      })
    }
    loadBadges()
    const interval = setInterval(loadBadges, 30000)
    return () => clearInterval(interval)
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    toast.success('Déconnecté')
    navigate('/admin/login')
  }

  const NAV: NavItem[] = [
    { to: '/admin',            label: 'Dashboard',   icon: LayoutDashboard, exact: true },
    { to: '/admin/blog',       label: 'Blog',         icon: FileText },
    { to: '/admin/rdv',        label: 'Rendez-vous',  icon: Calendar,        badge: badges.rdv },
    { to: '/admin/contacts',   label: 'Contacts',     icon: MessageSquare,   badge: badges.contacts },
    { to: '/admin/avis',       label: 'Avis',         icon: Star,            badge: badges.avis },
    { to: '/admin/newsletter', label: 'Newsletter',   icon: Mail },
    { to: '/admin/leads',      label: 'Leads Tests',  icon: TrendingUp,      badge: badges.leads },
  ]

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to)

  const totalBadges = badges.rdv + badges.contacts + badges.avis + badges.leads

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy min-h-screen fixed top-0 left-0 z-50">
        <div className="p-6 border-b border-white/10">
          <img src="/logo.png" alt="GESTORH" className="h-14 brightness-0 invert opacity-90"/>
          <p className="text-white/40 text-xs mt-2 font-semibold">Administration</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact, badge }) => {
            const active = isActive(to, exact)
            return (
              <Link key={to} to={to}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                  active ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
                )}>
                <Icon size={18}/>
                <span className="flex-1">{label}</span>
                {badge && badge > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-brand text-white text-[.6rem] font-extrabold flex items-center justify-center flex-shrink-0">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : active ? <ChevronRight size={14}/> : null}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{email}</p>
              <p className="text-white/40 text-[.65rem]">Administrateur</p>
            </div>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:bg-white/10 hover:text-white transition-all">
            <LogOut size={16}/> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-navy h-14 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="GESTORH" className="h-8 brightness-0 invert opacity-90"/>
          {totalBadges > 0 && (
            <span className="w-5 h-5 rounded-full bg-brand text-white text-[.6rem] font-extrabold flex items-center justify-center">
              {totalBadges > 9 ? '9+' : totalBadges}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs truncate max-w-[120px]">{email}</span>
          <button onClick={() => setOpen(v => !v)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)}/>

          {/* Panel */}
          <div className="relative ml-auto w-[280px] h-full bg-navy flex flex-col shadow-2xl overflow-hidden">

            {/* Header panel */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-black">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-bold truncate max-w-[140px]">{email}</p>
                  <p className="text-white/40 text-[.6rem]">Administrateur</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <X size={16}/>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV.map(({ to, label, icon: Icon, exact, badge }) => (
                <Link key={to} to={to} onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                    isActive(to, exact) ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
                  )}>
                  <Icon size={18}/>
                  <span className="flex-1">{label}</span>
                  {badge && badge > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-brand text-white text-[.6rem] font-extrabold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>

            {/* Déconnexion toujours visible en bas */}
            <div className="p-3 border-t border-white/10 flex-shrink-0 bg-navy">
              <button onClick={logout}
                className="flex items-center gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all">
                <LogOut size={16}/> Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-w-0">
        <Outlet/>
      </main>
    </div>
  )
}