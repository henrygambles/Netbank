import 'react-native-gesture-handler'
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import { useThemeStore } from './src/lib/stores/theme'
import { AppNavigator } from './src/navigation/AppNavigator'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

const NetbankLight = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#f8f9fc', card: '#ffffff', border: '#e2e6f0' },
}

const NetbankDark = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#0d0d1a', card: '#16162a', border: '#2a2a44' },
}

export default function App() {
  const isDark = useThemeStore(s => s.isDark)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppNavigator theme={isDark ? NetbankDark : NetbankLight} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
