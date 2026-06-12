'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

const COLORS = ['#ff3465', '#7b2ff7', '#11998e', '#f7971e', '#2193b0', '#e91e63', '#43a047']

const DEMO_INSIGHTS = {
  total: 288.19,
  period: 'month',
  categories: [
    { name: 'Food & Dining',   amount: 152.01, percentage: 47 },
    { name: 'Shopping',        amount: 89.99,  percentage: 21 },
    { name: 'Transport',       amount: 5.60,   percentage: 12 },
    { name: 'Entertainment',   amount: 17.99,  percentage: 10 },
    { name: 'Health',          amount: 22.60,  percentage: 6  },
  ],
}

interface Insights {
  total: number
  period: string
  categories: Array<{ name: string; amount: number; percentage: number }>
}

interface Props {
  insights?: Insights | null
}

export function SpendingChart({ insights }: Props) {
  // Fall back to demo data if API returned nothing or a bad shape
  const data: Insights =
    insights?.categories?.length ? insights : DEMO_INSIGHTS

  const categories = data.categories.slice(0, 7)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Spending this month</h2>
        <span className="text-xs text-gray-400">
          £{data.total.toLocaleString('en-GB', { minimumFractionDigits: 2 })} total
        </span>
      </div>

      {/* Donut chart — centred */}
      <div className="flex justify-center mb-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={72}
              dataKey="amount"
              strokeWidth={0}
              isAnimationActive
            >
              {categories.map((_, i) => (
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

      {/* Legend — full width below the chart */}
      <div className="flex flex-col gap-2">
        {data.categories.slice(0, 5).map((cat, i) => (
          <div key={cat.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 min-w-0 truncate">{cat.name}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums ml-2">
              £{cat.amount.toFixed(0)}
            </span>
            <span className="text-xs text-gray-400 w-9 text-right">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
