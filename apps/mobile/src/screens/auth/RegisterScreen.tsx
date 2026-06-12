import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../../lib/stores/auth'

export function RegisterScreen({ navigation }: any) {
  const register = useAuthStore(s => s.register)
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleRegister() {
    setLoading(true)
    setError(null)
    try {
      await register(form)
    } catch {
      setError('Something went wrong. Give it another shot?')
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
            <Text style={styles.title}>Open your account</Text>
            <Text style={styles.subtitle}>Takes 3 minutes. No nonsense.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>First name</Text>
                <TextInput style={styles.input} value={form.firstName} onChangeText={update('firstName')} placeholder="Alex" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Last name</Text>
                <TextInput style={styles.input} value={form.lastName} onChangeText={update('lastName')} placeholder="Smith" placeholderTextColor="rgba(255,255,255,0.3)" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={update('email')} placeholder="you@example.com" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={form.password} onChangeText={update('password')} placeholder="8+ characters" placeholderTextColor="rgba(255,255,255,0.3)" secureTextEntry />
            </View>

            {error && (
              <Animated.View entering={FadeInDown.springify()} style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.btn} activeOpacity={0.85}>
              <LinearGradient colors={['#ff3465', '#ff5580']} style={styles.btnInner}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create account →</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Log in</Text>
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
  logoCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  logoName: { color: '#fff', fontWeight: '800', fontSize: 22 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 32 },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  errorBox: { backgroundColor: 'rgba(255,52,101,0.15)', borderRadius: 12, padding: 12 },
  errorText: { color: '#ff8fa3', fontSize: 13, textAlign: 'center' },
  btn: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  btnInner: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  footerLink: { color: '#ff8fa3', fontSize: 14, fontWeight: '600' },
})
