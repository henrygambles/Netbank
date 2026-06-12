'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/lib/stores/auth'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { CryptoTicker } from '@/components/dashboard/CryptoTicker'
import { SabrinaWidget } from '@/components/sabrina/SabrinaWidget'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { PotCards } from '@/components/dashboard/PotCards'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

// ── Demo data shown for new users with no real data yet ──────────────────────
const DEMO_ACCOUNTS = [
  {
    id: 'demo-current',
    name: 'Current Account',
    type: 'CURRENT',
    balance: '4287.50',
    availableBalance: '4102.00',
    currency: 'GBP',
    color: 'linear-gradient(135deg, #ff3465 0%, #ff6b35 100%)',
    emoji: '💳',
    sortCode: '04-00-04',
    accountNumber: '00123456',
  },
  {
    id: 'demo-savings',
    name: 'Savings Account',
    type: 'SAVINGS',
    balance: '12500.00',
    availableBalance: '12500.00',
    currency: 'GBP',
    color: 'linear-gradient(135deg, #7b2ff7 0%, #2193b0 100%)',
    emoji: '🏦',
    sortCode: '04-00-04',
    accountNumber: '00654321',
  },
]

const now = new Date()
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString()

const DEMO_TRANSACTIONS = [
  { id: 't1',  description: 'Monzo Card', merchantName: 'Sainsbury\'s',      amount: '34.72', currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(30) },
  { id: 't2',  description: 'Transfer',   merchantName: 'Salary — ACME Ltd', amount: '3500.00',currency: 'GBP', direction: 'INBOUND',  merchantCategory: null,            createdAt: ago(60 * 18) },
  { id: 't3',  description: 'Card',       merchantName: 'TfL Travel',        amount: '5.60',  currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Transport',     createdAt: ago(60 * 22) },
  { id: 't4',  description: 'Card',       merchantName: 'Netflix',           amount: '17.99', currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Entertainment', createdAt: ago(60 * 26) },
  { id: 't5',  description: 'Card',       merchantName: 'Pret a Manger',     amount: '8.45',  currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60 * 30) },
  { id: 't6',  description: 'Card',       merchantName: 'ASOS',              amount: '89.99', currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Shopping',      createdAt: ago(60 * 48) },
  { id: 't7',  description: 'Card',       merchantName: 'Boots Pharmacy',    amount: '22.50', currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Health',        createdAt: ago(60 * 52) },
  { id: 't8',  description: 'Card',       merchantName: 'Uber Eats',         amount: '28.30', currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60 * 72) },
  { id: 't9',  description: 'Card',       merchantName: 'Waitrose',          amount: '61.14', currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60 * 96) },
  { id: 't10', description: 'Card',       merchantName: 'Deliveroo',         amount: '19.50', currency: 'GBP', direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60 * 120) },
]

const DEMO_INSIGHTS = {
  total: 919.14,
  period: 'month',
  categories: [
    { name: 'Food & Dining',   amount: 432.11, percentage: 47 },
    { name: 'Shopping',        amount: 189.99, percentage: 21 },
    { name: 'Transport',       amount: 112.40, percentage: 12 },
    { name: 'Entertainment',   amount: 87.98,  percentage: 10 },
    { name: 'Health',          amount: 54.66,  percentage: 6  },
    { name: 'Other',           amount: 42.00,  percentage: 4  },
  ],
}

const DEMO_POTS = [
  { id: 'p1', name: 'Holiday',      emoji: '🏖️', balance: '850.00',   targetAmount: '2000.00', color: '#f7971e' },
  { id: 'p2', name: 'Emergency',    emoji: '🛡️', balance: '3000.00',  targetAmount: '5000.00', color: '#11998e' },
  { id: 'p3', name: 'New MacBook',  emoji: '💻', balance: '620.00',   targetAmount: '1299.00', color: '#7b2ff7' },
]
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/v1/accounts').then(r => r.data).catch(() => []),
    staleTime: 30_000,
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => api.get('/v1/transactions?limit=10').then(r => r.data).catch(() => []),
  })

  const { data: insights } = useQuery({
    queryKey: ['insights', 'month'],
    queryFn: () => api.get('/v1/transactions/insights?period=month').then(r => r.data).catch(() => null),
  })

  const displayAccounts     = accounts?.length     ? accounts     : DEMO_ACCOUNTS
  const displayTransactions = transactions?.length  ? transactions : DEMO_TRANSACTIONS
  const displayInsights     = insights              ?? DEMO_INSIGHTS

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 mt-0.5">Here&apos;s your financial world.</p>
      </motion.div>

      {/* Crypto ticker strip */}
      <div className="mb-6">
        <CryptoTicker />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {displayAccounts.map((account: any, i: number) => (
            <BalanceCard key={account.id} account={account} index={i} />
          ))}

          <QuickActions />

          <SpendingChart insights={displayInsights} />

          <PotCards accountId={displayAccounts[0]?.id} demoPots={accounts?.length ? undefined : DEMO_POTS} />

          <RecentTransactions transactions={displayTransactions} />
        </div>

        {/* Right column — Sabrina */}
        <div className="lg:col-span-1">
          <SabrinaWidget />
        </div>
      </div>
    </div>
  )
}
