'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, Bitcoin, Sparkles,
  Settings, LogOut, BellRing, PiggyBank, Heart,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/crypto', icon: Bitcoin, label: 'Crypto' },
  { href: '/save', icon: PiggyBank, label: 'Save' },
  { href: '/invest', icon: Heart, label: 'Invest' },
  { href: '/sabrina', icon: Sparkles, label: 'Sabrina' },
  { href: '/notifications', icon: BellRing, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="w-64 hidden lg:flex flex-col bg-white dark:bg-navy-900 border-r border-gray-100 dark:border-white/5 py-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-coral flex items-center justify-center text-white font-bold text-sm">N</div>
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">netbank</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                active
                  ? 'bg-coral-50 dark:bg-coral-500/10 text-coral-600 dark:text-coral-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-coral-50 dark:bg-coral-500/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className={clsx('w-4 h-4 relative', active ? 'text-coral-500' : '')} />
              <span className="relative">{label}</span>
              {label === 'Sabrina' && (
                <span className="relative ml-auto flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-coral-500" />
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pt-4 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-coral flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-gray-400 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
