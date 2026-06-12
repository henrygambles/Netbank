'use client'

import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface Props {
  account: {
    id: string
    name: string
    type: string
    balance: string
    availableBalance: string
    currency: string
    color: string
    emoji?: string
    sortCode?: string
    accountNumber?: string
  }
  index: number
}

const currencySymbols: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', JPY: '¥', CHF: 'Fr',
}

export function BalanceCard({ account, index }: Props) {
  const [hidden, setHidden] = useState(false)
  const symbol = currencySymbols[account.currency] ?? account.currency + ' '

  const formattedBalance = hidden
    ? '••••••'
    : new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        parseFloat(account.balance),
      )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative rounded-2xl overflow-hidden shadow-card group"
      style={{ background: account.color }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />

      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {account.emoji && <span className="text-lg">{account.emoji}</span>}
              <span className="text-white/70 text-sm font-medium uppercase tracking-wider">{account.name}</span>
            </div>
            <div className="text-white/50 text-xs font-mono">
              {account.sortCode && `${account.sortCode} · `}{account.accountNumber}
            </div>
          </div>
          <button
            onClick={() => setHidden(v => !v)}
            className="text-white/50 hover:text-white/90 transition-colors p-1"
          >
            {hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        <div className="mb-4">
          <div className="text-white/60 text-xs mb-1">Total balance</div>
          <div className="number-large text-white flex items-baseline gap-1">
            <span className="text-2xl font-semibold opacity-70">{symbol}</span>
            {formattedBalance}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-white/50 text-xs">
            Available: {symbol}{hidden ? '••••' : new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2 }).format(parseFloat(account.availableBalance))}
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <ArrowUpRight className="w-3 h-3" /> Send
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <ArrowDownLeft className="w-3 h-3" /> Add money
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
