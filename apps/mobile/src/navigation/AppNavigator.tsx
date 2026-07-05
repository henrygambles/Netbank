import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuthStore } from '../lib/stores/auth'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { TransactionsScreen } from '../screens/TransactionsScreen'
import { CryptoScreen } from '../screens/CryptoScreen'
import { SabrinaScreen } from '../screens/SabrinaScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { InvestScreen } from '../screens/InvestScreen'
import { ConnectBankScreen } from '../screens/ConnectBankScreen'
import { TabBar } from './TabBar'
import { api } from '../lib/api/client'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Crypto" component={CryptoScreen} />
      <Tab.Screen name="Invest" component={InvestScreen} />
      <Tab.Screen name="Sabrina" component={SabrinaScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

// Wrap ConnectBank as a proper screen for navigation
function ConnectBankWrapper({ navigation }: any) {
  const canGoBack = navigation.canGoBack()
  const exit = () => {
    if (canGoBack) navigation.goBack()
    else navigation.replace('Main')
  }
  return <ConnectBankScreen onDone={exit} onSkip={exit} />
}

// Manage onboarding gate: show ConnectBank on first login if no connections exist
function AuthenticatedNavigator() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null)

  useEffect(() => {
    // 4-second timeout so a downed/unreachable API never causes a permanent blank screen
    const timer = setTimeout(() => setInitialRoute('Main'), 4000)

    api.get('/v1/open-banking/connections')
      .then(r => {
        clearTimeout(timer)
        setInitialRoute(r.data?.length === 0 ? 'ConnectBank' : 'Main')
      })
      .catch(() => {
        clearTimeout(timer)
        setInitialRoute('Main')
      })

    return () => clearTimeout(timer)
  }, [])

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d1a' }}>
        <ActivityIndicator color="#ff3465" size="large" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ConnectBank" component={ConnectBankWrapper} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  )
}

export function AppNavigator({ theme }: { theme?: any }) {
  const user = useAuthStore(s => s.user)

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Authenticated" component={AuthenticatedNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
