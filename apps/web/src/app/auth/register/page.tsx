'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { GoogleButton } from '@/components/ui/GoogleButton'
import { AppleButton } from '@/components/ui/AppleButton'

const steps = ['Account', 'Personal', 'Done']

export default function RegisterPage() {
  const router = useRouter()
  const register = useAuthStore(s => s.register)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
  })

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 0) { setStep(1); return }

    setLoading(true)
    setError(null)
    try {
      await register(form)
      setStep(2)
      setTimeout(() => router.push('/onboarding'), 1800)
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Unknown error'
      setError(`Error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-coral flex items-center justify-center font-bold text-white">N</div>
            <span className="font-bold text-xl text-white tracking-tight">netbank</span>
          </Link>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < step ? 'bg-coral-500 text-white' :
                  i === step ? 'bg-coral-500/20 border border-coral-500 text-coral-400' :
                  'bg-white/5 border border-white/10 text-gray-600'
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-px transition-colors duration-300 ${i < step ? 'bg-coral-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-white">
            {step === 2 ? "You're in! 🎉" : step === 0 ? 'Open your account' : 'Tell us about you'}
          </h1>
          <p className="text-gray-400 mt-1">
            {step === 2 ? 'Setting up your account...' : step === 0 ? 'Takes 3 minutes, max.' : 'Almost there.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 2 ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <motion.div
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-20 h-20 rounded-full bg-coral-500 flex items-center justify-center animate-pulse-coral"
              >
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </motion.div>
              <p className="text-white font-semibold text-lg">Welcome to Netbank, {form.firstName}!</p>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: step === 0 ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-8"
            >
              {step === 0 && (
                <>
                  <div className="flex flex-col gap-3 mb-6">
                    <GoogleButton label="Sign up with Google" />
                    <AppleButton label="Sign up with Apple" />
                  </div>
                  <div className="relative flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {step === 0 ? (
                  <>
                    <InputField label="Email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
                    <InputField label="Password" type="password" value={form.password} onChange={update('password')} placeholder="8+ characters" minLength={8} />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="First name" value={form.firstName} onChange={update('firstName')} placeholder="Alex" />
                      <InputField label="Last name" value={form.lastName} onChange={update('lastName')} placeholder="Smith" />
                    </div>
                    <InputField label="Phone (optional)" type="tel" value={form.phone} onChange={update('phone')} placeholder="+44 7700 000000" />
                  </>
                )}

                {error && (
                  <p className="text-coral-400 text-sm text-center bg-coral-500/10 rounded-lg px-4 py-2">{error}</p>
                )}

                <div className="flex gap-3 mt-1">
                  {step > 0 && (
                    <button type="button" onClick={() => setStep(s => s - 1)} className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button type="submit" disabled={loading} className="btn-coral flex-1 flex items-center justify-center gap-2 py-3.5 disabled:opacity-60">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <>{step === 0 ? 'Continue' : 'Create account'} <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 2 && (
          <p className="text-center text-gray-500 mt-6 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-coral-400 hover:text-coral-300 font-medium">Log in</Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-coral-500 focus:ring-1 focus:ring-coral-500 transition-colors"
      />
    </div>
  )
}
