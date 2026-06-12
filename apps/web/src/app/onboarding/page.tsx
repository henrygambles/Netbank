'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Sparkles, Globe, PiggyBank, Bell, Zap } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

const CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
]

const POT_ICONS = ['🏖️', '🏠', '🚗', '💍', '🎓', '✈️', '🎮', '💪']

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'currency', label: 'Currency' },
  { id: 'pot', label: 'Savings' },
  { id: 'done', label: 'Done' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [step, setStep] = useState(0)
  const [currency, setCurrency] = useState('GBP')
  const [potName, setPotName] = useState('')
  const [potTarget, setPotTarget] = useState('')
  const [potIcon, setPotIcon] = useState('🏖️')
  const [skipPot, setSkipPot] = useState(false)

  const firstName = user?.firstName ?? 'there'

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  function finish() {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-coral-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-10">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.id}
              className="h-1 rounded-full flex-1"
              animate={{ backgroundColor: i <= step ? '#ff3465' : 'rgba(255,255,255,0.08)' }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <Step key="welcome">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-coral flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-9 h-9 text-white" />
              </motion.div>

              <h1 className="text-3xl font-bold text-white text-center mb-3">
                Hey {firstName}! 👋
              </h1>
              <p className="text-gray-400 text-center text-lg mb-2">
                Welcome to Netbank.
              </p>
              <p className="text-gray-500 text-center mb-10">
                Let's get you set up in 60 seconds. We just need a couple of things.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { icon: Globe, label: 'Multi-currency', desc: 'Spend anywhere' },
                  { icon: PiggyBank, label: 'Smart savings', desc: 'Pots & goals' },
                  { icon: Zap, label: 'Sabrina AI', desc: 'Your money brain' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="glass rounded-xl p-4 text-center">
                    <Icon className="w-6 h-6 text-coral-400 mx-auto mb-2" />
                    <p className="text-white text-xs font-semibold">{label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>

              <button onClick={next} className="btn-coral w-full flex items-center justify-center gap-2 py-4 text-lg">
                Let's go <ArrowRight className="w-5 h-5" />
              </button>
            </Step>
          )}

          {step === 1 && (
            <Step key="currency">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-coral-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-coral-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Main currency</h2>
                  <p className="text-gray-500 text-sm">Your primary account currency</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
                      currency === c.code
                        ? 'border-coral-500 bg-coral-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{c.code}</p>
                      <p className="text-gray-500 text-xs">{c.name}</p>
                    </div>
                    {currency === c.code && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-coral-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button onClick={next} className="btn-coral w-full flex items-center justify-center gap-2 py-4">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </Step>
          )}

          {step === 2 && (
            <Step key="pot">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-coral-500/20 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-coral-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create a savings pot</h2>
                  <p className="text-gray-500 text-sm">Set a goal and watch it grow</p>
                </div>
              </div>

              {!skipPot ? (
                <>
                  {/* Icon picker */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {POT_ICONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setPotIcon(icon)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                          potIcon === icon ? 'bg-coral-500/20 ring-2 ring-coral-500 scale-110' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 mb-6">
                    <input
                      value={potName}
                      onChange={e => setPotName(e.target.value)}
                      placeholder="e.g. Holiday fund"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-coral-500 focus:ring-1 focus:ring-coral-500 transition-colors"
                    />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {CURRENCIES.find(c => c.code === currency)?.symbol ?? '£'}
                      </span>
                      <input
                        type="number"
                        value={potTarget}
                        onChange={e => setPotTarget(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-coral-500 focus:ring-1 focus:ring-coral-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSkipPot(true)}
                      className="flex-1 py-3.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={next}
                      disabled={!potName.trim()}
                      className="btn-coral flex-1 flex items-center justify-center gap-2 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Create pot <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
                  <p className="text-gray-400 mb-6">No worries — you can create pots anytime from the dashboard.</p>
                  <button onClick={next} className="btn-coral flex items-center justify-center gap-2 py-4 px-8 mx-auto">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </Step>
          )}

          {step === 3 && (
            <Step key="done">
              <div className="flex flex-col items-center text-center py-4">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                  className="w-24 h-24 rounded-full bg-coral-500 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(255,52,101,0.5)]"
                >
                  <Check className="w-12 h-12 text-white" strokeWidth={2.5} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white mb-3"
                >
                  You're all set!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-400 mb-10 text-lg"
                >
                  Your Netbank account is ready. Time to explore.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full space-y-3 mb-10"
                >
                  {[
                    { icon: '✅', text: `Account created in ${currency}` },
                    { icon: skipPot ? '⏭️' : '✅', text: skipPot ? 'Savings pot — set up later' : `Savings pot "${potIcon} ${potName}" created` },
                    { icon: '🤖', text: 'Sabrina AI is ready to help' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                      <span>{icon}</span>
                      <span className="text-gray-300 text-sm">{text}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={finish}
                  className="btn-coral w-full flex items-center justify-center gap-2 py-4 text-lg"
                >
                  Go to my dashboard <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </Step>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
