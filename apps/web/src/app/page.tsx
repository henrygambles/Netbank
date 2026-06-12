'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, Globe, Sparkles } from 'lucide-react'

const features = [
  { icon: Zap, title: 'Instant everything', body: 'Payments land in seconds, not days. Because waiting is so last decade.' },
  { icon: Shield, title: 'Locked down tight', body: 'Bank-grade encryption, biometric auth, and a fraud team that never sleeps.' },
  { icon: Globe, title: 'Every currency on earth', body: 'Hold, spend, and convert 23 fiat currencies. Plus the whole crypto universe.' },
  { icon: Sparkles, title: 'Meet Sabrina', body: 'Your AI financial sidekick. She knows your money better than your accountant.' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-950 text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 glass-dark">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-coral flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="font-bold text-lg tracking-tight">netbank</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Log in
          </Link>
          <Link href="/auth/register" className="btn-coral text-sm px-5 py-2.5">
            Get started
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center">
        {/* Glow blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-coral-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-purple-600 rounded-full blur-[100px] opacity-10 pointer-events-none" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative max-w-4xl mx-auto"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-coral-400" />
            Now with Sabrina AI — your personal finance brain
          </motion.div>

          <motion.h1 variants={item} className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Banking that{' '}
            <span className="bg-gradient-coral bg-clip-text text-transparent">actually</span>
            {' '}makes sense.
          </motion.h1>

          <motion.p variants={item} className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Current accounts, savings, multi-currency, crypto wallets, and an AI that genuinely understands your finances. All in one place.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-coral inline-flex items-center gap-2 px-8 py-4 text-base">
              Open your account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white/80 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all">
              I already have an account
            </Link>
          </motion.div>
        </motion.div>

        {/* Mock card */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative mt-20 max-w-sm mx-auto"
          style={{ perspective: '1000px' }}
        >
          <div className="relative w-full aspect-[1.586] rounded-2xl bg-gradient-coral p-6 shadow-coral overflow-hidden animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full border-2 border-white/30" />
            <div className="absolute top-4 right-10 w-12 h-12 rounded-full bg-white/10 border-2 border-white/20" />
            <div className="relative h-full flex flex-col justify-between">
              <div className="text-white/80 font-medium text-sm tracking-wider">NETBANK</div>
              <div>
                <div className="text-white/60 text-xs mb-1 font-mono">•••• •••• •••• 4242</div>
                <div className="text-white font-bold text-2xl tracking-tight">£12,450.00</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={item}
              className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-coral-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-coral-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-400 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-2xl mx-auto glass rounded-3xl p-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-coral opacity-10 rounded-3xl" />
          <h2 className="relative text-3xl font-extrabold mb-4">Ready to switch?</h2>
          <p className="relative text-gray-400 mb-8">Takes less than 3 minutes. No credit check. No nonsense.</p>
          <Link href="/auth/register" className="btn-coral inline-flex items-center gap-2 px-8 py-4">
            Open your account <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/5 text-center text-gray-600 text-sm">
        © 2026 Netbank Ltd · Authorised by the FCA · FSCS protected up to £85,000
      </footer>
    </div>
  )
}
