import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../api/client'
import type { User } from '@netbank/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  refresh: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, accessToken: null, refreshToken: null,

      login: async (email, password) => {
        const { data } = await api.post('/v1/auth/login', { email, password })
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        await get().refreshProfile()
      },

      register: async (formData) => {
        const { data } = await api.post('/v1/auth/register', formData)
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        await get().refreshProfile()
      },

      logout: async () => {
        const refreshToken = get().refreshToken
        if (refreshToken) await api.post('/v1/auth/logout', { refreshToken }).catch(() => {})
        set({ user: null, accessToken: null, refreshToken: null })
      },

      refreshProfile: async () => {
        const { data } = await api.get('/v1/users/me')
        set({ user: data })
      },

      refresh: async () => {
        const token = get().refreshToken
        if (!token) { set({ user: null, accessToken: null, refreshToken: null }); return }
        try {
          const { data } = await api.post('/v1/auth/refresh', { refreshToken: token })
          set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        } catch {
          set({ user: null, accessToken: null, refreshToken: null })
        }
      },
    }),
    { name: 'netbank-auth', storage: createJSONStorage(() => AsyncStorage) },
  ),
)
