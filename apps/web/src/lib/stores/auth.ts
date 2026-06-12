import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api/client'
import type { User } from '@netbank/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: async (email, password) => {
        const { data } = await api.post('/v1/auth/login', { email, password })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        await get().refreshProfile()
      },

      register: async (formData) => {
        const { data } = await api.post('/v1/auth/register', formData)
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        await get().refreshProfile()
      },

      logout: async () => {
        const refreshToken = get().refreshToken
        if (refreshToken) {
          await api.post('/v1/auth/logout', { refreshToken }).catch(() => {})
        }
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      refreshProfile: async () => {
        const { data } = await api.get('/v1/users/me')
        set({ user: data })
      },
    }),
    { name: 'netbank-auth', partialize: s => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }) },
  ),
)
