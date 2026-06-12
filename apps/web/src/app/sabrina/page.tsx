'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Plus, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { SabrinaWidget } from '@/components/sabrina/SabrinaWidget'
import { formatDistanceToNow } from 'date-fns'

export default function SabrinaPage() {
  const { data: conversations } = useQuery({
    queryKey: ['sabrina-conversations'],
    queryFn: () => api.get('/v1/sabrina/conversations').then(r => r.data),
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-coral flex items-center justify-center shadow-coral">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sabrina</h1>
            <p className="text-gray-500">Your AI financial brain. Always on, always honest.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2">
          <SabrinaWidget />
        </div>

        {/* Past conversations */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Past conversations</h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {conversations?.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  Your conversations will appear here.
                </div>
              )}
              {conversations?.slice(0, 10).map((convo: any) => (
                <motion.button
                  key={convo.id}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-coral-50 dark:bg-coral-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-coral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{convo.title}</div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
