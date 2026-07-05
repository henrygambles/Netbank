import React, { useEffect, useState } from 'react'
import {
  Modal, View, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../lib/useColors'

interface Props {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [mounted, setMounted] = useState(false)
  const ty = useSharedValue(700)
  const bgOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      ty.value = withSpring(0, { damping: 24, stiffness: 220, mass: 0.8 })
      bgOpacity.value = withTiming(1, { duration: 220 })
    } else {
      ty.value = withTiming(700, { duration: 260 })
      bgOpacity.value = withTiming(0, { duration: 220 })
      const t = setTimeout(() => setMounted(false), 280)
      return () => clearTimeout(t)
    }
  }, [visible])

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }))

  if (!mounted) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          </Animated.View>
          <View style={styles.outer} pointerEvents="box-none">
            <Animated.View style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 24 }, sheetStyle]}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
              {children}
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.52)' },
  outer: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
})
