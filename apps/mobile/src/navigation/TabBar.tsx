import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withSequence } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../lib/useColors'

const TAB_ICONS: Record<string, string> = {
  Home: '⌂', Transactions: '↔', Crypto: '₿', Invest: '♥', Sabrina: '✦', Settings: '⚙',
}

export function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets()
  const c = useColors()

  return (
    <View style={[
      styles.container,
      { paddingBottom: insets.bottom + 4, backgroundColor: c.surface, borderTopColor: c.borderSub },
    ]}>
      {state.routes.map((route: any, index: number) => {
        const active = state.index === index
        return (
          <TabItem
            key={route.key}
            label={route.name}
            icon={TAB_ICONS[route.name] ?? '●'}
            active={active}
            colors={c}
            onPress={() => navigation.navigate(route.name)}
          />
        )
      })}
    </View>
  )
}

function TabItem({ label, icon, active, onPress, colors: c }: {
  label: string; icon: string; active: boolean; onPress: () => void; colors: ReturnType<typeof useColors>
}) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  function handlePress() {
    scale.value = withSequence(withSpring(0.85, { damping: 10 }), withSpring(1, { damping: 10 }))
    onPress()
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.tab} activeOpacity={0.7}>
      <Animated.View style={[styles.tabInner, animatedStyle]}>
        <View style={[styles.iconContainer, active && { backgroundColor: '#ff346515' }]}>
          <Text style={[styles.icon, { color: active ? '#ff3465' : c.textTertiary }]}>{icon}</Text>
        </View>
        <Text style={[styles.label, { color: active ? '#ff3465' : c.textTertiary, fontWeight: active ? '700' : '500' }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabInner: { alignItems: 'center', gap: 3 },
  iconContainer: { width: 40, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  label: { fontSize: 10 },
})
