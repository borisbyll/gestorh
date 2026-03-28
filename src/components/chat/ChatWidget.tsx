import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence }                   from 'framer-motion'
import { MessageCircle, X, Send, Bot, Loader2 }      from 'lucide-react'
import { cn, nanoid }  from '@/lib/utils'
import { supabase }    from '@/lib/supabase'

interface Msg {
  id:      string
  role:    'user' | 'assistant'
  content: string
  ts:      Date
}

const WELCOME: Msg = {
  id: 'w', role: 'assistant', ts: new Date(),
  content: "Bonjour 👋 Je suis l'assistant GESTORH. Posez-moi vos questions sur nos services RH, psychologie et coaching !",
}

export default function ChatWidget() {
  const [open,    setOpen]    = useState(false)
  const [msgs,    setMsgs]    = useState<Msg[]>([WELCOME])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sid]                 = useState(() => {
    const k = 'gs_sid'
    return sessionStorage.getItem(k) || (() => {
      const id = nanoid()
      sessionStorage.setItem(k, id)
      return id
    })()
  })
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || msgs.length > 21) return

    const userMsg: Msg = { id: nanoid(), role: 'user', content: text, ts: new Date() }
    setMsgs(p => [...p, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          sessionId: sid,
          messages:  [...msgs, userMsg]
            .filter(m => m.id !== 'w')
            .slice(-10)
            .map(m => ({ role: m.role, content: m.content })),
        },
      })
      if (error) throw error
      setMsgs(p => [...p, {
        id:      nanoid(),
        role:    'assistant',
        content: data?.content || 'Désolé, une erreur est survenue. Contactez-nous au +228 98 91 23 69.',
        ts:      new Date(),
      }])
    } catch {
      setMsgs(p => [...p, {
        id:      nanoid(),
        role:    'assistant',
        content: 'Une erreur est survenue. Contactez-nous via WhatsApp ou au +228 98 91 23 69.',
        ts:      new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, msgs, sid])

  return (
    <>
      {/* FAB */}
      <motion.button onClick={() => setOpen(v => !v)} aria-label="Chat GESTORH"
        className="fixed bottom-[86px] right-7 z-[800] w-14 h-14 rounded-full bg-navy text-white shadow-xl flex items-center justify-center"
        whileHover={{ scale: 1.1 }} whileTap={{ scale: .95 }}>
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22}/></motion.div>
            : <motion.div key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle size={22}/></motion.div>
          }
        </AnimatePresence>
        {!open && <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-brand border-2 border-white"/>}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: .95 }}
            animate={{ opacity: 1, y: 0,  scale: 1   }}
            exit={{    opacity: 0, y: 20, scale: .95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-[170px] right-7 z-[800] w-[min(390px,calc(100vw-2rem))]
                       bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ height: 'min(560px,calc(100vh-210px))' }}
          >
            {/* Header */}
            <div className="bg-navy px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Bot size={18} className="text-white"/>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Assistant GESTORH</p>
                <p className="text-[.7rem] text-white/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>
                  Propulsé par Claude AI
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              {msgs.map(m => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2')}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-navy/10 flex items-center justify-center flex-shrink-0 mb-0.5">
                      <Bot size={13} className="text-navy"/>
                    </div>
                  )}
                  <div className={m.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <time className={cn('text-[.6rem] mt-1 block', m.role === 'user' ? 'text-white/50' : 'text-gray-400')}>
                      {m.ts.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-xl bg-navy/10 flex items-center justify-center">
                    <Bot size={13} className="text-navy"/>
                  </div>
                  <div className="bubble-ai flex items-center gap-1.5 py-3.5">
                    <span className="dot-bounce"/>
                    <span className="dot-bounce"/>
                    <span className="dot-bounce"/>
                  </div>
                </div>
              )}

              {msgs.length > 21 && (
                <p className="text-center text-xs text-gray-400">
                  Limite atteinte — <a href="/rendez-vous" className="text-navy font-semibold">Prendre RDV</a>
                </p>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0">
              <div className="flex gap-2 items-end bg-gray-50 rounded-2xl border border-gray-200 p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  disabled={loading || msgs.length > 21}
                  placeholder="Posez votre question…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none resize-none py-1.5 px-1 max-h-28 font-medium"
                />
                <button onClick={send}
                  disabled={!input.trim() || loading || msgs.length > 21}
                  className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center disabled:opacity-40 hover:bg-navy-mid transition-colors flex-shrink-0">
                  {loading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}