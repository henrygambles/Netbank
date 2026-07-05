import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../lib/stores/auth'
import { useThemeStore } from '../lib/stores/theme'
import { useColors } from '../lib/useColors'
import { BottomSheet } from '../components/BottomSheet'

function SuccessView({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  const scale = useSharedValue(0.4)
  useEffect(() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }) }, [])
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return (
    <Animated.View style={[styles.successWrap, s]}>
      <Text style={styles.successEmoji}>{emoji}</Text>
      <Text style={styles.successTitle}>{title}</Text>
      <Text style={styles.successSub}>{sub}</Text>
    </Animated.View>
  )
}

const CURRENCIES = ['GBP £', 'USD $', 'EUR €', 'JPY ¥', 'CAD $', 'AUD $']
const LANGUAGES = ['English', 'Español', 'Français', 'Deutsch', 'Polski', '中文']

export function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<any>()
  const { user, logout } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const c = useColors()

  const [notifPush, setNotifPush] = useState(true)

  // Sheet visibility
  const [profileOpen, setProfileOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  // Profile state
  const [profileFirstName, setProfileFirstName] = useState(user?.firstName ?? '')
  const [profileLastName, setProfileLastName] = useState(user?.lastName ?? '')
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '')
  const [profileDone, setProfileDone] = useState(false)

  // Security state
  const [faceIdOn, setFaceIdOn] = useState(true)
  const [twoFaOn, setTwoFaOn] = useState(false)
  const [securityDone, setSecurityDone] = useState(false)

  // Card state
  const [cardFrozen, setCardFrozen] = useState(false)
  const [contactlessOn, setContactlessOn] = useState(true)
  const [onlineOn, setOnlineOn] = useState(true)
  const [cardDone, setCardDone] = useState(false)

  // Currency / language
  const [selectedCurrency, setSelectedCurrency] = useState('GBP £')
  const [selectedLanguage, setSelectedLanguage] = useState('English')

  // Feedback
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackDone, setFeedbackDone] = useState(false)

  function handleItem(label: string) {
    switch (label) {
      case 'Personal details': setProfileDone(false); setProfileFirstName(user?.firstName ?? ''); setProfileLastName(user?.lastName ?? ''); setProfileEmail(user?.email ?? ''); setProfileOpen(true); break
      case 'Security': setSecurityDone(false); setSecurityOpen(true); break
      case 'Cards': setCardDone(false); setCardOpen(true); break
      case 'Currency display': setCurrencyOpen(true); break
      case 'Language': setLanguageOpen(true); break
      case 'Connected Banks': navigation.navigate('ConnectBank'); break
      case 'Terms & Privacy': setTermsOpen(true); break
      case 'Give feedback': setFeedbackDone(false); setFeedbackText(''); setFeedbackRating(5); setFeedbackOpen(true); break
      case 'Rate Netbank': setFeedbackDone(false); setFeedbackText(''); setFeedbackRating(5); setFeedbackOpen(true); break
      default: break
    }
  }

  const sections = [
    { section: 'Account', items: [
      { icon: '👤', label: 'Personal details' },
      { icon: '🔒', label: 'Security' },
      { icon: '📱', label: 'Notifications', toggleKey: 'notif' as const },
      { icon: '💳', label: 'Cards' },
      { icon: '🏦', label: 'Connected Banks' },
    ]},
    { section: 'App', items: [
      { icon: '🌙', label: 'Dark mode', toggleKey: 'dark' as const },
      { icon: '🔔', label: 'Push notifications', toggleKey: 'notifPush' as const },
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
    <>
      <ScrollView style={[styles.container, { backgroundColor: c.bg }]}>
        {/* Profile header */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => handleItem('Personal details')}>
          <View style={[styles.header, { paddingTop: insets.top + 24, backgroundColor: c.surface, borderBottomColor: c.borderSub }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
            </View>
            <Text style={[styles.name, { color: c.text }]}>{user?.firstName} {user?.lastName}</Text>
            <Text style={[styles.email, { color: c.textSub }]}>{user?.email}</Text>
            <Text style={[styles.editHint, { color: '#ff3465' }]}>Edit profile →</Text>
          </View>
        </TouchableOpacity>

        {sections.map(({ section, items }) => (
          <View key={section} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textTertiary }]}>{section}</Text>
            <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              {items.map(({ icon, label, toggleKey }, i) => {
                const isToggle = !!toggleKey
                const isOn = toggleKey === 'dark' ? isDark : toggleKey === 'notif' || toggleKey === 'notifPush' ? notifPush : false
                return (
                  <TouchableOpacity key={label}
                    style={[styles.item, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.borderSub }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (toggleKey === 'dark') toggle()
                      else if (toggleKey === 'notif' || toggleKey === 'notifPush') setNotifPush(v => !v)
                      else handleItem(label)
                    }}
                  >
                    <Text style={styles.itemIcon}>{icon}</Text>
                    <Text style={[styles.itemLabel, { color: c.text }]}>{label}</Text>
                    {isToggle
                      ? <Switch value={isOn}
                          onValueChange={toggleKey === 'dark' ? toggle : () => setNotifPush(v => !v)}
                          trackColor={{ false: c.border, true: '#ff3465' }} thumbColor="#fff" />
                      : <Text style={[styles.chevron, { color: c.border }]}>›</Text>
                    }
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={logout}
          style={[styles.logoutBtn, { backgroundColor: c.surface, borderColor: '#ff346530' }]} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
        <Text style={[styles.version, { color: c.textTertiary }]}>Netbank v0.1.0 · Made with ✦</Text>
      </ScrollView>

      {/* PROFILE SHEET */}
      <BottomSheet visible={profileOpen} onClose={() => setProfileOpen(false)}>
        {profileDone ? (
          <SuccessView emoji="✓" title="Details updated" sub="Your profile has been saved." />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Personal details</Text>
            {[
              { label: 'First name', value: profileFirstName, set: setProfileFirstName, placeholder: 'First name' },
              { label: 'Last name', value: profileLastName, set: setProfileLastName, placeholder: 'Last name' },
              { label: 'Email address', value: profileEmail, set: setProfileEmail, placeholder: 'Email', keyboard: 'email-address' as const },
            ].map(({ label, value, set, placeholder, keyboard }) => (
              <View key={label}>
                <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>{label}</Text>
                <TextInput style={[styles.sheetInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
                  placeholder={placeholder} placeholderTextColor={c.textTertiary} keyboardType={keyboard}
                  value={value} onChangeText={set} />
              </View>
            ))}
            <TouchableOpacity style={styles.sheetCta} activeOpacity={0.85} onPress={() => setProfileDone(true)}>
              <View style={[styles.sheetCtaSolid, { backgroundColor: '#ff3465' }]}>
                <Text style={styles.sheetCtaText}>Save changes →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* SECURITY SHEET */}
      <BottomSheet visible={securityOpen} onClose={() => setSecurityOpen(false)}>
        {securityDone ? (
          <SuccessView emoji="🔒" title="Security updated" sub="Your security settings have been saved." />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Security</Text>
            {[
              { label: 'Face ID / Touch ID', sub: 'Use biometrics to log in', value: faceIdOn, set: setFaceIdOn },
              { label: 'Two-factor authentication', sub: 'Extra protection via SMS code', value: twoFaOn, set: setTwoFaOn },
            ].map(({ label, sub, value, set }) => (
              <View key={label} style={[styles.toggleRow, { borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: c.text }]}>{label}</Text>
                  <Text style={[styles.toggleSub, { color: c.textTertiary }]}>{sub}</Text>
                </View>
                <Switch value={value} onValueChange={set} trackColor={{ false: c.border, true: '#ff3465' }} thumbColor="#fff" />
              </View>
            ))}
            <TouchableOpacity style={[styles.sheetCta, { marginTop: 8 }]} activeOpacity={0.85} onPress={() => setSecurityDone(true)}>
              <View style={[styles.sheetCtaSolid, { backgroundColor: '#ff3465' }]}>
                <Text style={styles.sheetCtaText}>Save settings →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* CARDS SHEET */}
      <BottomSheet visible={cardOpen} onClose={() => setCardOpen(false)}>
        {cardDone ? (
          <SuccessView emoji="💳" title="Card settings saved" sub="Changes will apply to your virtual card immediately." />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Card controls</Text>
            <View style={[styles.virtualCard, { borderColor: cardFrozen ? '#9aa5be' : '#ff346540' }]}>
              <Text style={styles.virtualCardNum}>•••• •••• •••• 4242</Text>
              <Text style={[styles.virtualCardStatus, { color: cardFrozen ? '#9aa5be' : '#00c853' }]}>
                {cardFrozen ? '❄️  Frozen' : '✓  Active'}
              </Text>
            </View>
            {[
              { label: 'Freeze card', sub: 'Instantly block all transactions', value: cardFrozen, set: setCardFrozen },
              { label: 'Contactless payments', sub: 'Allow tap-to-pay up to £100', value: contactlessOn, set: setContactlessOn },
              { label: 'Online payments', sub: 'Allow e-commerce transactions', value: onlineOn, set: setOnlineOn },
            ].map(({ label, sub, value, set }) => (
              <View key={label} style={[styles.toggleRow, { borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: c.text }]}>{label}</Text>
                  <Text style={[styles.toggleSub, { color: c.textTertiary }]}>{sub}</Text>
                </View>
                <Switch value={value} onValueChange={set} trackColor={{ false: c.border, true: label === 'Freeze card' ? '#9aa5be' : '#ff3465' }} thumbColor="#fff" />
              </View>
            ))}
            <TouchableOpacity style={styles.sheetCta} activeOpacity={0.85} onPress={() => setCardDone(true)}>
              <View style={[styles.sheetCtaSolid, { backgroundColor: '#ff3465' }]}>
                <Text style={styles.sheetCtaText}>Save card settings →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* CURRENCY SHEET */}
      <BottomSheet visible={currencyOpen} onClose={() => setCurrencyOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: c.text }]}>Display currency</Text>
          <Text style={[styles.sheetStory, { color: c.textSub }]}>Choose which currency balances are displayed in.</Text>
          <View style={styles.optionList}>
            {CURRENCIES.map(cur => (
              <TouchableOpacity key={cur} onPress={() => { setSelectedCurrency(cur); setCurrencyOpen(false) }}
                style={[styles.optionRow, { borderColor: c.border, backgroundColor: selectedCurrency === cur ? '#ff346510' : c.bg }]}>
                <Text style={[styles.optionText, { color: c.text }]}>{cur}</Text>
                {selectedCurrency === cur && <Text style={{ color: '#ff3465', fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheet>

      {/* LANGUAGE SHEET */}
      <BottomSheet visible={languageOpen} onClose={() => setLanguageOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: c.text }]}>Language</Text>
          <View style={styles.optionList}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity key={lang} onPress={() => { setSelectedLanguage(lang); setLanguageOpen(false) }}
                style={[styles.optionRow, { borderColor: c.border, backgroundColor: selectedLanguage === lang ? '#ff346510' : c.bg }]}>
                <Text style={[styles.optionText, { color: c.text }]}>{lang}</Text>
                {selectedLanguage === lang && <Text style={{ color: '#ff3465', fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheet>

      {/* TERMS SHEET */}
      <BottomSheet visible={termsOpen} onClose={() => setTermsOpen(false)}>
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: c.text }]}>Terms & Privacy</Text>
          {[
            { heading: 'Your data', body: 'We never sell your personal data. Your financial information is encrypted at rest and in transit using AES-256 and TLS 1.3.' },
            { heading: 'FCA regulated', body: 'Netbank is authorised and regulated by the Financial Conduct Authority (FCA). Reference number: 123456.' },
            { heading: 'FSCS protected', body: 'Your deposits are protected up to £85,000 under the Financial Services Compensation Scheme.' },
            { heading: 'Full terms', body: 'Full terms & conditions are available at netbank.com/legal. We recommend you read them.' },
          ].map(({ heading, body }) => (
            <View key={heading} style={styles.termsBlock}>
              <Text style={[styles.termsHeading, { color: c.text }]}>{heading}</Text>
              <Text style={[styles.termsBody, { color: c.textSub }]}>{body}</Text>
            </View>
          ))}
        </View>
      </BottomSheet>

      {/* FEEDBACK SHEET */}
      <BottomSheet visible={feedbackOpen} onClose={() => setFeedbackOpen(false)}>
        {feedbackDone ? (
          <SuccessView emoji="⭐" title="Thanks for the feedback!" sub="Your thoughts help make Netbank better for everyone." />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Rate Netbank</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setFeedbackRating(n)}>
                  <Text style={[styles.star, { color: n <= feedbackRating ? '#f7971e' : c.border }]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Tell us more (optional)</Text>
            <TextInput style={[styles.sheetInput, styles.sheetInputTall, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
              placeholder="What do you love? What could be better?" placeholderTextColor={c.textTertiary}
              value={feedbackText} onChangeText={setFeedbackText} multiline numberOfLines={4} textAlignVertical="top" />
            <TouchableOpacity style={styles.sheetCta} activeOpacity={0.85} onPress={() => setFeedbackDone(true)}>
              <View style={[styles.sheetCtaSolid, { backgroundColor: '#f7971e' }]}>
                <Text style={styles.sheetCtaText}>Submit feedback →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingBottom: 32, borderBottomWidth: 1 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 2 },
  editHint: { fontSize: 13, fontWeight: '600', marginTop: 8 },
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
  // Sheets
  sheetContent: { paddingHorizontal: 24 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  sheetLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  sheetInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  sheetInputTall: { height: 90, paddingTop: 13 },
  sheetCta: { marginTop: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  sheetCtaSolid: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  sheetCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sheetStory: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 1 },
  virtualCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 16, alignItems: 'center', gap: 6 },
  virtualCardNum: { fontFamily: 'monospace', fontSize: 15, color: '#6b7a99', letterSpacing: 2 },
  virtualCardStatus: { fontSize: 13, fontWeight: '700' },
  optionList: { gap: 8, marginTop: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  optionText: { fontSize: 15, fontWeight: '500' },
  termsBlock: { marginBottom: 16 },
  termsHeading: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  termsBody: { fontSize: 13, lineHeight: 20 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'center' },
  star: { fontSize: 40 },
  successWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#6b7a99', textAlign: 'center', lineHeight: 22 },
})
