import Constants from 'expo-constants'

// On a physical device running Expo Go, localhost means the device itself — not
// the Mac. We read the Metro bundler host from expo-constants (e.g. "192.168.1.5")
// and point the API at the same machine on port 3000.
function resolveApiUrl(): string {
  if (!__DEV__) return 'https://api.netbank.com'
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host && host !== 'localhost') return `http://${host}:3000`
  return 'http://localhost:3000'
}

export const API_URL = resolveApiUrl()
