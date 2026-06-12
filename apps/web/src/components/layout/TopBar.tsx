'use client'

import { Bell, Search, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { motion } from 'framer-motion'

export function TopBar() {
  const [dark, setDark] = useState(false)

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/v1/notifications').then(r => r.data),
  })

  const unread = notifications?.filter((n: any) => !n.read).length ?? 0

  function toggleDark() {
    setDark(v => !v)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-navy-900 border-b border-gray-100 dark:border-white/5">
      <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 w-72 border border-gray-100 dark:border-white/8">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search transactions, payees…"
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none flex-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleDark}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral-500"
            />
          )}
        </button>
      </div>
    </header>
  )
}
