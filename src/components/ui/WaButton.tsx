import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export default function WaButton() {
  return (
    <motion.a
      href="https://wa.me/22898912369"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter GESTORH sur WhatsApp"
      className="fixed bottom-7 right-7 z-[800] w-14 h-14 rounded-full bg-[#25d366]
                 shadow-[0_6px_28px_rgba(37,211,102,.4)] flex items-center justify-center text-white"
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: .95 }}
    >
      <MessageCircle size={24} fill="white" stroke="none"/>
    </motion.a>
  )
}