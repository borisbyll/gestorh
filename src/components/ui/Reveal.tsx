import { useInView } from 'react-intersection-observer'
import { motion }    from 'framer-motion'

interface Props {
  children:  React.ReactNode
  delay?:    number
  className?: string
}

export default function Reveal({ children, delay = 0, className = '' }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: .1 })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: .7, delay, ease: [.16, 1, .3, 1] }}
    >
      {children}
    </motion.div>
  )
}