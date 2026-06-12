import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../lib/stores/auth'
import { useThemeStore } from '../lib/stores/theme'
import { useColors } from '../lib/useColors'

export function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const c = useColors()

  const sections = [
    { section: 'Account', items: [
      { icon: '👤', label: 'Personal details' },
      { icon: '🔒', label: 'Security' },
      { icon: '📱', label: 'Notifications' },
      { icon: '💳', label: 'Cards' },
    ]},
    { section: 'App', items: [
      { icon: '🌙', label: 'Dark mode', toggleKey: 'dark' },
      { icon: '🔔', label: 'Push notifications', toggleKey: 'notif' },
      { icon: '🌍', label: 'Currency display' },
      { icon: '💬', label: 'Language' },
    ]},
    { section: 'About', items: [
      { icon: '📄', label: 'Terms & Privacy' },
      { icon: '💬', label: 'Give feedback' },
      { icon: '⭐', label: 'Rate Netbank' },
    ]},
  ]

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Profile header */}
      <View style={[styles.header, { paddingTop: insets.top + 24, backgroundColor: c.surface, borderBottomColor: c.borderSub }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
        </View>
        <Text style={[styles.name, { color: c.text }]}>{user?.firstName} {user?.lastName}</Text>
        <Text style={[styles.email, { color: c.textSub }]}>{user?.email}</Text>
      </View>

      {sections.map(({ section, items }) => (
        <View key={section} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>{section}</Text>
          <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {items.map(({ icon, label, toggleKey }, i) => {
              const isToggle = !!toggleKey
              const isOn = toggleKey === 'dark' ? isDark : false
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.item, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.borderSub }]}
                  activeOpacity={0.7}
                  onPress={toggleKey === 'dark' ? toggle : undefined}
                >
                  <Text style={styles.itemIcon}>{icon}</Text>
                  <Text style={[styles.itemLabel, { color: c.text }]}>{label}</Text>
                  {isToggle
                    ? <Switch
                        value={isOn}
                        onValueChange={toggleKey === 'dark' ? toggle : undefined}
                        trackColor={{ false: c.border, true: '#ff3465' }}
                        thumbColor="#fff"
                      />
                    : <Text style={[styles.chevron, { color: c.border }]}>›</Text>
                  }
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={logout}
        style={[styles.logoutBtn, { backgroundColor: c.surface, borderColor: '#ff346530' }]}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: c.textTertiary }]}>Netbank v0.1.0 · Made with ✦</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingBottom: 32, borderBottomWidth: 1 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  itemIcon: { fontSize: 18 },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  chevron: { fontSize: 20 },
  logoutBtn: { margin: 16, marginTop: 32, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  logoutText: { color: '#ff3465', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, marginBottom: 40 },
})
