'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

const COLORS = ['#ff3465', '#7b2ff7', '#11998e', '#f7971e', '#2193b0', '#e91e63', '#43a047']

interface Props {
  insights: {
    total: number
    period: string
    categories: Array<{ name: string; amount: number; percentage: number }>
  }
}

export function SpendingChart({ insights }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Spending this month</h2>
        <span className="text-xs text-gray-400">
          £{insights.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })} total
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={insights.categories.slice(0, 7)}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={56}
                dataKey="amount"
                strokeWidth={0}
              >
                {insights.categories.slice(0, 7).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`£${v.toFixed(2)}`, '']}
                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          {insights.categories.slice(0, 5).map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 truncate">{cat.name}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                £{cat.amount.toFixed(0)}
              </span>
              <span className="text-xs text-gray-400 w-10 text-right">{cat.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
