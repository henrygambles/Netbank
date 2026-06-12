'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api/client'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

const FEATURED = ['BTC', 'ETH', 'SOL', 'XMR', 'USDT', 'BNB', 'ADA', 'DOGE', 'MATIC', 'LINK']

export default function CryptoPage() {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'market'>('portfolio')

  const { data: portfolio } = useQuery({
    queryKey: ['crypto-portfolio'],
    queryFn: () => api.get('/v1/crypto/portfolio').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['crypto-market'],
    queryFn: () => api.get('/v1/crypto/prices?currencies=' + FEATURED.join(',')).then(r => r.data),
    refetchInterval: 30_000,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crypto</h1>
          <p className="text-gray-500 mt-0.5">Your digital asset universe.</p>
        </div>
        <button className="btn-coral flex items-center gap-2 text-sm px-4 py-2.5">
          <Plus className="w-4 h-4" /> Add wallet
        </button>
      </div>

      {/* Portfolio summary */}
      {portfolio && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-navy p-6 mb-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-coral-500/10 to-transparent" />
          <div className="relative">
            <div className="text-white/60 text-sm mb-1">Total portfolio value</div>
            <div className="text-4xl font-bold text-white mb-1">
              £{portfolio.totalGBP?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) ?? '0.00'}
            </div>
            <div className="text-white/50 text-sm">${portfolio.totalUSD?.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}</div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-6 w-fit">
        {(['portfolio', 'market'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'portfolio' ? (
          <motion.div key="portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {portfolio?.wallets?.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-4">₿</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No wallets yet</h3>
                <p className="text-gray-500 text-sm mb-6">Add a wallet to start holding crypto.</p>
                <button className="btn-coral mx-auto flex items-center gap-2 text-sm px-5 py-2.5">
                  <Plus className="w-4 h-4" /> Add your first wallet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolio?.wallets?.map((wallet: any, i: number) => (
                  <WalletRow key={wallet.currency} wallet={wallet} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-2">
              {pricesLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 shimmer rounded-xl" />
                  ))
                : prices?.map((price: any, i: number) => (
                    <MarketRow key={price.currency} price={price} index={i} />
                  ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WalletRow({ wallet, index }: { wallet: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-4 flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-sm">
        {wallet.currency.slice(0, 2)}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 dark:text-white">{wallet.currency}</div>
        <div className="text-gray-500 text-sm font-mono">{parseFloat(wallet.balance).toFixed(6)}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-gray-900 dark:text-white">£{wallet.valueFiat ?? '—'}</div>
      </div>
      <div className="flex gap-2">
        <button className="w-8 h-8 rounded-lg bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center hover:bg-coral-100 transition-colors">
          <ArrowUpRight className="w-4 h-4 text-coral-500" />
        </button>
        <button className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-100 transition-colors">
          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
        </button>
      </div>
    </motion.div>
  )
}

function MarketRow({ price, index }: { price: any; index: number }) {
  const isUp = price.change24h >= 0
  const sparkData = (price.sparkline ?? []).map((v: number) => ({ v }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-xs">
        {price.currency.slice(0, 3)}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900 dark:text-white">{price.currency}</div>
        <div className={`text-xs flex items-center gap-1 font-medium ${isUp ? 'text-emerald-500' : 'text-coral-500'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(price.change24h).toFixed(2)}% 24h
        </div>
      </div>
      {sparkData.length > 0 && (
        <div className="w-20 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={isUp ? '#00c853' : '#ff3465'}
                fill={isUp ? '#00c85315' : '#ff346515'}
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="text-right w-28">
        <div className="font-semibold text-gray-900 dark:text-white text-sm">
          ${parseFloat(price.priceUSD).toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </div>
      </div>
    </motion.div>
  )
}
