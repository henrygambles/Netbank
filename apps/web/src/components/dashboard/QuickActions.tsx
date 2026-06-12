'use client'

import { motion } from 'framer-motion'
import { Send, Plus, ArrowLeftRight, CreditCard, PiggyBank, Sparkles } from 'lucide-react'

const actions = [
  { icon: Send, label: 'Send', color: '#ff3465', href: '/dashboard/send' },
  { icon: Plus, label: 'Add money', color: '#7b2ff7', href: '/dashboard/topup' },
  { icon: ArrowLeftRight, label: 'Exchange', color: '#11998e', href: '/dashboard/exchange' },
  { icon: CreditCard, label: 'Payments', color: '#2193b0', href: '/dashboard/payments' },
  { icon: PiggyBank, label: 'Save', color: '#f7971e', href: '/dashboard/save' },
  { icon: Sparkles, label: 'Sabrina', color: '#e91e63', href: '/sabrina' },
]

export function QuickActions() {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Quick actions</h2>
      <div className="grid grid-cols-6 gap-2">
        {actions.map(({ icon: Icon, label, color, href }, i) => (
          <motion.a
            key={label}
            href={href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
              style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium text-center leading-tight">{label}</span>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
