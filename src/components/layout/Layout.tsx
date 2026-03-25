import { Outlet }    from 'react-router-dom'
import Navbar        from './Navbar'
import Footer        from './Footer'
import WaButton      from '@/components/ui/WaButton'
import ChatWidget    from '@/components/chat/ChatWidget'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-[72px]">
        <Outlet />
      </main>
      <Footer />
      <WaButton />
      <ChatWidget />
    </div>
  )
}