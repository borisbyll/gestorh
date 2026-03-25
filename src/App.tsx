import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState }                   from 'react'
import { supabase }                              from '@/lib/supabase'
import Layout                                    from '@/components/layout/Layout'
import HomePage                                  from '@/pages/HomePage'
import BlogPage                                  from '@/pages/BlogPage'
import BlogPost                                  from '@/pages/BlogPost'
import TestsPage                                 from '@/pages/TestsPage'
import RdvPage                                   from '@/pages/RdvPage'
import ContactPage                               from '@/pages/ContactPage'
import NotFound                                  from '@/pages/NotFound'
import AdminLayout                               from '@/admin/components/AdminLayout'
import LoginPage                                 from '@/admin/pages/LoginPage'
import DashboardPage                             from '@/admin/pages/DashboardPage'
import BlogAdminPage                             from '@/admin/pages/BlogAdminPage'
import RdvAdminPage                              from '@/admin/pages/RdvAdminPage'
import ContactsAdminPage                         from '@/admin/pages/ContactsAdminPage'
import AvisAdminPage                             from '@/admin/pages/AvisAdminPage'
import UnsubscribePage                           from '@/pages/UnsubscribePage'
import NewsletterAdminPage                       from '@/admin/pages/NewsletterAdminPage'
import LeadsAdminPage                            from '@/admin/pages/LeadsAdminPage'
import RegisterPage                              from '@/pages/RegisterPage'
import LoginUserPage                             from '@/pages/LoginUserPage'
import ConfirmEmailPage                          from '@/pages/ConfirmEmailPage'
import MyTestsPage                               from '@/pages/MyTestsPage'
import OffresPage                                from '@/pages/OffresPage'
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [auth,    setAuth]    = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuth(!!data.session)
    })
  }, [])

  if (auth === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return auth ? <>{children}</> : <Navigate to="/admin/login" replace/>
}

export default function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [pathname])

  return (
    <Routes>
      {/* Site public */}
      <Route element={<Layout />}>
        <Route path="/"            element={<HomePage />} />
        <Route path="/blog"        element={<BlogPage />} />
        <Route path="/blog/:slug"  element={<BlogPost />} />
        <Route path="/tests"       element={<TestsPage />} />
        <Route path="/offres"      element={<OffresPage />} />
        <Route path="/rendez-vous" element={<RdvPage />} />
        <Route path="/contact"     element={<ContactPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/connexion"   element={<LoginUserPage />} />
        <Route path="/confirmer-email" element={<ConfirmEmailPage />} />
        <Route path="/mes-tests"       element={<MyTestsPage />} />
        <Route path="/desabonnement" element={<UnsubscribePage />} />
        <Route path="*"            element={<NotFound />} />
      </Route>

      {/* Login admin */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Dashboard admin protégé */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index                element={<DashboardPage />} />
        <Route path="blog"          element={<BlogAdminPage />} />
        <Route path="rdv"           element={<RdvAdminPage />} />
        <Route path="contacts"      element={<ContactsAdminPage />} />
        <Route path="avis"          element={<AvisAdminPage />} />
        <Route path="newsletter"    element={<NewsletterAdminPage />} />
        <Route path="leads"         element={<LeadsAdminPage />} />
      </Route>
    </Routes>
  )
}