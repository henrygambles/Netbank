'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, RotateCcw, Loader2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { clsx } from 'clsx'
import type { SabrinaStreamEvent } from '@netbank/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
}

const starters = [
  "How much have I spent this month?",
  "What's my crypto portfolio worth?",
  "Can you help me save for a holiday?",
  "How's Bitcoin doing today?",
]

export function SabrinaWidget() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', streaming: true }

    setMessages(m => [...m, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/sabrina/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ message: content, conversationId }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6)) as SabrinaStreamEvent

          if (event.type === 'message_start') {
            setConversationId(event.conversationId)
          }
          if (event.type === 'content_delta') {
            setMessages(m => m.map(msg =>
              msg.id === assistantMsg.id
                ? { ...msg, content: msg.content + event.delta }
                : msg
            ))
          }
          if (event.type === 'message_end') {
            setMessages(m => m.map(msg =>
              msg.id === assistantMsg.id ? { ...msg, streaming: false } : msg
            ))
          }
          if ((event as any).type === 'error') {
            setMessages(m => m.map(msg =>
              msg.id === assistantMsg.id
                ? { ...msg, content: (event as any).message ?? 'Unknown error', streaming: false, error: true }
                : msg
            ))
          }
        }
      }
    } catch {
      setMessages(m => m.map(msg =>
        msg.id === assistantMsg.id
          ? { ...msg, content: "Can't reach the API. Make sure the backend is running.", streaming: false, error: true }
          : msg
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card flex flex-col h-[600px] sticky top-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/5">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 dark:text-white text-sm">Sabrina</div>
          <div className="text-xs text-gray-400">Your AI financial assistant</div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setConversationId(undefined) }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="New conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              Hi! I&apos;m Sabrina. I can see all your finances and help you make sense of them. What&apos;s on your mind?
            </p>
            {starters.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-sm px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-coral-50 dark:hover:bg-coral-500/10 border border-gray-100 dark:border-white/5 hover:border-coral-200 dark:hover:border-coral-500/30 text-gray-600 dark:text-gray-300 transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5',
                  msg.error
                    ? 'bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700'
                    : 'bg-gradient-to-br from-coral-400 to-coral-600'
                )}>
                  {msg.error
                    ? <span className="text-red-500 text-xs font-bold">!</span>
                    : <Sparkles className="w-3 h-3 text-white" />
                  }
                </div>
              )}
              <div className={clsx(
                'max-w-[80%] text-sm rounded-2xl leading-relaxed',
                msg.role === 'user'
                  ? 'bg-coral-500 text-white rounded-br-sm px-3.5 py-2.5'
                  : msg.error
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-bl-sm overflow-hidden'
                    : 'bg-gray-100 dark:bg-white/8 text-gray-800 dark:text-gray-200 rounded-bl-sm px-3.5 py-2.5'
              )}>
                {msg.error ? (
                  <div>
                    <div className="px-3.5 py-2 bg-red-100 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800">
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 tracking-wide uppercase">
                        ⚠ Couldn't respond
                      </span>
                    </div>
                    <p className="px-3.5 py-2.5 text-red-700 dark:text-red-300">{msg.content}</p>
                  </div>
                ) : (
                  <>
                    {msg.content}
                    {msg.streaming && (
                      <span className="inline-flex gap-0.5 ml-1 align-middle">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="w-1 h-1 rounded-full bg-current opacity-60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3.5 py-2.5 border border-gray-200 dark:border-white/8 focus-within:border-coral-400 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask Sabrina anything…"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            disabled={loading}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg bg-coral-500 flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" />
            }
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">Sabrina can make mistakes. Verify important decisions.</p>
      </div>
    </div>
  )
}
