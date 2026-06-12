'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { api } from '@/lib/api/client'

interface Pot {
  id: string
  name: string
  emoji?: string
  balance: string
  targetAmount?: string
  color: string
}

interface Props {
  accountId: string
  demoPots?: Pot[]
}

export function PotCards({ accountId, demoPots }: Props) {
  const { data: account } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => api.get(`/v1/accounts/${accountId}`).then(r => r.data).catch(() => null),
    enabled: !accountId.startsWith('demo-'),
  })

  const pots: Pot[] = account?.pots?.length
    ? account.pots
    : (demoPots ?? [])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Savings pots</h2>
        <button className="w-7 h-7 rounded-full bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center hover:bg-coral-100 dark:hover:bg-coral-500/20 transition-colors">
          <Plus className="w-3.5 h-3.5 text-coral-500" />
        </button>
      </div>

      {pots.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm mb-2">No pots yet</p>
          <p className="text-gray-400 text-xs">Create a pot to save for something specific.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {pots.map((pot, i) => {
            const balance = parseFloat(pot.balance)
            const target = pot.targetAmount ? parseFloat(pot.targetAmount) : null
            const progress = target ? Math.min((balance / target) * 100, 100) : null

            return (
              <motion.div
                key={pot.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl p-3 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: `${pot.color}15`, border: `1px solid ${pot.color}30` }}
              >
                <div className="text-xl mb-1">{pot.emoji ?? '🏦'}</div>
                <div className="font-semibold text-gray-900 dark:text-white text-xs truncate">{pot.name}</div>
                <div className="font-bold text-sm mt-0.5" style={{ color: pot.color }}>
                  £{balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </div>
                {target && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    of £{target.toLocaleString('en-GB', { minimumFractionDigits: 0 })}
                  </div>
                )}
                {progress !== null && (
                  <div className="mt-2 h-1 rounded-full bg-black/10 dark:bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 + 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: pot.color }}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
