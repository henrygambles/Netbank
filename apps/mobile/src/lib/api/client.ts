import axios from 'axios'

const BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.netbank.com'

export const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async config => {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default
  const stored = await AsyncStorage.getItem('netbank-auth')
  if (stored) {
    const parsed = JSON.parse(stored)
    const token = parsed?.state?.accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  r => r,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { useAuthStore } = await import('../stores/auth')
        await useAuthStore.getState().refresh()
        const token = useAuthStore.getState().accessToken
        if (token) {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }
      } catch {}
    }
    return Promise.reject(error)
  },
)
