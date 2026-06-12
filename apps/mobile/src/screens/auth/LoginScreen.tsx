import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../../lib/stores/auth'

export function LoginScreen({ navigation }: any) {
  const login = useAuthStore(s => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
    } catch {
      setError("That doesn't look right. Try again?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0d0d1a', '#1a1a2e', '#16213e']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logo}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>N</Text>
            </View>
            <Text style={styles.logoName}>netbank</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Good to see you again.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
              />
            </View>

            {error && (
              <Animated.View entering={FadeInDown.springify()} style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtn} activeOpacity={0.85}>
              <LinearGradient colors={['#ff3465', '#ff5580']} style={styles.loginBtnInner}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.loginBtnText}>Log in →</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Get started</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 },
  logoCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  logoName: { color: '#fff', fontWeight: '800', fontSize: 22, letterSpacing: -0.5 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  errorBox: { backgroundColor: 'rgba(255,52,101,0.15)', borderRadius: 12, padding: 12 },
  errorText: { color: '#ff8fa3', fontSize: 13, textAlign: 'center' },
  loginBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  loginBtnInner: {
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#ff3465', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  footerLink: { color: '#ff8fa3', fontSize: 14, fontWeight: '600' },
})
