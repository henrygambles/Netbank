'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'

const categoryColors: Record<string, string> = {
  Food: '#f7971e', Transport: '#2193b0', Shopping: '#7b2ff7',
  Entertainment: '#e91e63', Health: '#11998e', Other: '#6b7a99',
}

interface Transaction {
  id: string
  description: string
  merchantName?: string
  amount: string
  currency: string
  direction: string
  merchantCategory?: string
  createdAt: string
}

interface Props {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: Props) {
  if (!transactions.length) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-500 text-sm">No transactions yet. Make your first payment!</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent transactions</h2>
        <Link href="/transactions" className="text-coral-500 text-xs font-medium hover:text-coral-600 flex items-center gap-1">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <ul>
        {transactions.map((tx, i) => {
          const isOut = tx.direction === 'OUTBOUND'
          const color = categoryColors[tx.merchantCategory ?? 'Other'] ?? '#6b7a99'
          const amount = parseFloat(tx.amount)
          const formatted = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2 }).format(amount)

          return (
            <motion.li
              key={tx.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/transactions/${tx.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ backgroundColor: `${color}18` }}
                >
                  {isOut
                    ? <ArrowUpRight className="w-4 h-4" style={{ color }} />
                    : <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {tx.merchantName ?? tx.description}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5 flex items-center gap-2">
                    {tx.merchantCategory && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        {tx.merchantCategory}
                      </span>
                    )}
                    {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className={clsx('font-semibold text-sm tabular-nums', isOut ? 'text-gray-900 dark:text-white' : 'text-emerald-500')}>
                  {isOut ? '-' : '+'}£{formatted}
                </div>
              </Link>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
