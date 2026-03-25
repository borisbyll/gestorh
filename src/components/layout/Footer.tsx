import { Link } from 'react-router-dom'
import { Linkedin, Facebook, MessageCircle, MapPin, Phone, Clock } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-[#080f22]">
      <div className="wrap py-20">

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/[.06]">

          <div>
            <img src="/logo.png" alt="GESTORH" className="h-12 mb-5 brightness-0 invert opacity-90"/>
            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-[230px]">
              Cabinet expert en RH, Psychologie et Coaching — Lomé, Togo — plus de 10 ans d'expertise.
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Linkedin,      href: 'https://www.linkedin.com/company/cabinet-gestorh/', label: 'LinkedIn' },
                { Icon: Facebook,      href: 'https://www.facebook.com/share/1N1L3mFM6w/',       label: 'Facebook' },
                { Icon: MessageCircle, href: 'https://wa.me/22898912369',                         label: 'WhatsApp' },
              ].map(({ Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center
                             text-white/40 hover:border-blue hover:text-white hover:bg-blue transition-all duration-200">
                  <Icon size={16}/>
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Services">
            <h4 className="text-[.69rem] font-extrabold tracking-[2px] uppercase text-white/80 mb-5">Services</h4>
            {['Solutions RH', 'Coaching Pro', 'Psychologie', 'Thérapie couple', 'Tests & Bilans'].map(s => (
              <Link key={s} to={s === 'Tests & Bilans' ? '/tests' : '/#expertises'}
                className="block text-sm text-white/40 mb-2.5 hover:text-white hover:pl-1 transition-all">
                {s}
              </Link>
            ))}
          </nav>

          <nav aria-label="Cabinet">
            <h4 className="text-[.69rem] font-extrabold tracking-[2px] uppercase text-white/80 mb-5">Cabinet</h4>
            {[
              { label: 'Blog',          to: '/blog' },
              { label: 'Témoignages',   to: '/#temoignages' },
              { label: 'Notre adresse', to: '/#localisation' },
              { label: 'Prendre RDV',   to: '/rendez-vous' },
              { label: 'Contact',       to: '/contact' },
            ].map(c => (
              <Link key={c.label} to={c.to}
                className="block text-sm text-white/40 mb-2.5 hover:text-white hover:pl-1 transition-all">
                {c.label}
              </Link>
            ))}
          </nav>

          <div>
            <h4 className="text-[.69rem] font-extrabold tracking-[2px] uppercase text-white/80 mb-5">Contact</h4>
            <ul className="space-y-3.5">
              <li className="flex gap-3 text-sm text-white/40">
                <MapPin size={15} className="flex-shrink-0 mt-0.5 text-brand"/>
                <span>Hédzranawoé, Rue N°4<br/>Lomé — Togo</span>
              </li>
              <li className="flex gap-3 text-sm text-white/40">
                <Phone size={15} className="flex-shrink-0 mt-0.5 text-brand"/>
                <span>
                  <a href="tel:+22898912369" className="hover:text-white">+228 98 91 23 69</a><br/>
                  <a href="tel:+22890036187" className="hover:text-white">+228 90 03 61 87</a>
                </span>
              </li>
              <li className="flex gap-3 text-sm text-white/40">
                <Clock size={15} className="flex-shrink-0 mt-0.5 text-brand"/>
                <span>Lun–Ven 08h–18h<br/>Sam 09h–16h</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 text-xs text-white/20">
          <span>© {year} GESTORH — Tous droits réservés</span>
          <span>Hédzranawoé, Rue N°4 · Lomé, Togo</span>
        </div>
      </div>
    </footer>
  )
}