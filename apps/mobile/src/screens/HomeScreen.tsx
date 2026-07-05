import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl, TextInput, Alert,
} from 'react-native'
import Animated, {
  FadeInDown, FadeInRight,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, G } from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { api } from '../lib/api/client'
import { useAuthStore } from '../lib/stores/auth'
import { useColors } from '../lib/useColors'
import { BottomSheet } from '../components/BottomSheet'

const { width } = Dimensions.get('window')

// ── Demo data ────────────────────────────────────────────────────────────────
const now = new Date()
const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString()

const DEMO_ACCOUNTS = [
  { id: 'demo-current', name: 'Current Account',  balance: '4287.50', availableBalance: '4102.00', accountNumber: '00123456', sortCode: '04-00-04', colors: ['#ff3465', '#ff6b35'] as [string, string] },
  { id: 'demo-savings', name: 'Savings Account',   balance: '12500.00', availableBalance: '12500.00', accountNumber: '00654321', sortCode: '04-00-04', colors: ['#7b2ff7', '#2193b0'] as [string, string] },
]
const DEMO_TRANSACTIONS = [
  { id: 't1', merchantName: "Sainsbury's",   amount: '34.72',  direction: 'OUTBOUND', createdAt: ago(30) },
  { id: 't2', merchantName: 'Salary — ACME', amount: '3500.00',direction: 'INBOUND',  createdAt: ago(60*18) },
  { id: 't3', merchantName: 'TfL Travel',    amount: '5.60',   direction: 'OUTBOUND', createdAt: ago(60*22) },
  { id: 't4', merchantName: 'Netflix',        amount: '17.99',  direction: 'OUTBOUND', createdAt: ago(60*26) },
  { id: 't5', merchantName: 'Pret a Manger', amount: '8.45',   direction: 'OUTBOUND', createdAt: ago(60*30) },
  { id: 't6', merchantName: 'ASOS',           amount: '89.99',  direction: 'OUTBOUND', createdAt: ago(60*48) },
  { id: 't7', merchantName: 'Deliveroo',      amount: '28.30',  direction: 'OUTBOUND', createdAt: ago(60*72) },
  { id: 't8', merchantName: 'Boots Pharmacy', amount: '22.50', direction: 'OUTBOUND', createdAt: ago(60*96) },
]
const DEMO_INSIGHTS = {
  total: 288.19,
  categories: [
    { name: 'Food & Dining', amount: 152.01, percentage: 47, color: '#ff3465' },
    { name: 'Shopping',      amount: 89.99,  percentage: 21, color: '#7b2ff7' },
    { name: 'Transport',     amount: 5.60,   percentage: 12, color: '#11998e' },
    { name: 'Entertainment', amount: 17.99,  percentage: 10, color: '#f7971e' },
    { name: 'Health',        amount: 22.60,  percentage: 6,  color: '#2193b0' },
    { name: 'Other',         amount: 0,      percentage: 4,  color: '#9aa5be' },
  ],
}
const DEMO_POTS = [
  { emoji: '🏖️', name: 'Holiday',   balance: 850,  target: 2000, color: '#f7971e' },
  { emoji: '🛡️', name: 'Emergency', balance: 3000, target: 5000, color: '#11998e' },
  { emoji: '💻', name: 'MacBook',   balance: 620,  target: 1299, color: '#7b2ff7' },
]
const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', rate: 1.27 },
  { code: 'EUR', flag: '🇪🇺', rate: 1.17 },
  { code: 'JPY', flag: '🇯🇵', rate: 192.4 },
  { code: 'CAD', flag: '🇨🇦', rate: 1.73 },
  { code: 'AUD', flag: '🇦🇺', rate: 1.96 },
]
const QUICK_AMOUNTS = ['10', '25', '50', '100']
const POT_EMOJIS = ['🏖️','🛡️','💻','🚗','✈️','🎓','🏠','💍']

// ── Donut chart ───────────────────────────────────────────────────────────────
const DS = 120, DSW = 20, DR = (DS - DSW) / 2, DC = 2 * Math.PI * DR
function DonutChart({ categories }: { categories: typeof DEMO_INSIGHTS.categories }) {
  let angle = 0
  return (
    <Svg width={DS} height={DS}>
      <G rotation={-90} origin={`${DS/2},${DS/2}`}>
        {categories.filter(c => c.percentage > 0).map((cat, i) => {
          const arc = (cat.percentage / 100) * DC
          const rot = angle
          angle += (cat.percentage / 100) * 360
          return (
            <Circle key={i} cx={DS/2} cy={DS/2} r={DR} fill="none"
              stroke={cat.color} strokeWidth={DSW}
              strokeDasharray={`${arc} ${DC}`}
              rotation={rot} origin={`${DS/2},${DS/2}`} />
          )
        })}
      </G>
    </Svg>
  )
}

// ── Success overlay ───────────────────────────────────────────────────────────
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

// ── Input pill ────────────────────────────────────────────────────────────────
function AmountPills({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  const c = useColors()
  return (
    <View style={styles.pills}>
      {QUICK_AMOUNTS.map(a => (
        <TouchableOpacity key={a} onPress={() => onSelect(a)}
          style={[styles.pill, { borderColor: selected === a ? '#ff3465' : c.border, backgroundColor: selected === a ? '#ff346515' : c.bg }]}>
          <Text style={[styles.pillText, { color: selected === a ? '#ff3465' : c.textSub }]}>£{a}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const navigation = useNavigation<any>()
  const user = useAuthStore(s => s.user)

  const [balanceHidden, setBalanceHidden] = useState(false)
  const [activeAccount, setActiveAccount] = useState(0)

  // Sheet state
  const [sendOpen, setSendOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [exchangeOpen, setExchangeOpen] = useState(false)
  const [activePot, setActivePot] = useState<typeof DEMO_POTS[0] | null>(null)
  const [newPotOpen, setNewPotOpen] = useState(false)

  // Send state
  const [sendRecipient, setSendRecipient] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendRef, setSendRef] = useState('')
  const [sendDone, setSendDone] = useState(false)

  // Add state
  const [addAmount, setAddAmount] = useState('50')
  const [addCustom, setAddCustom] = useState('')
  const [addDone, setAddDone] = useState(false)

  // Exchange state
  const [exAmount, setExAmount] = useState('100')
  const [exCurrency, setExCurrency] = useState(CURRENCIES[0])
  const [exDone, setExDone] = useState(false)

  // Pot state
  const [potTopup, setPotTopup] = useState('25')
  const [potDone, setPotDone] = useState(false)

  // New pot state
  const [newPotEmoji, setNewPotEmoji] = useState('🏖️')
  const [newPotName, setNewPotName] = useState('')
  const [newPotTarget, setNewPotTarget] = useState('')
  const [newPotDone, setNewPotDone] = useState(false)

  const { data: accounts, isRefetching, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/v1/accounts').then(r => r.data).catch(() => []),
  })
  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => api.get('/v1/transactions?limit=8').then(r => r.data).catch(() => []),
  })
  const { data: insights } = useQuery({
    queryKey: ['insights', 'month'],
    queryFn: () => api.get('/v1/transactions/insights?period=month').then(r => r.data).catch(() => null),
  })

  const displayAccounts = accounts?.length
    ? accounts.map((a: any, i: number) => ({ ...a, colors: DEMO_ACCOUNTS[i % 2]?.colors ?? DEMO_ACCOUNTS[0].colors }))
    : DEMO_ACCOUNTS
  const displayTransactions = transactions?.length ? transactions : DEMO_TRANSACTIONS
  const displayInsights = insights?.categories?.length ? insights : DEMO_INSIGHTS

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'
  const totalBalance = displayAccounts.reduce((s: number, a: any) => s + parseFloat(a.balance ?? '0'), 0)

  function resetAndClose(setter: (v: boolean) => void, resets: (() => void)[]) {
    setter(false)
    setTimeout(() => resets.forEach(r => r()), 350)
  }

  const exRate = exCurrency.rate
  const exConverted = ((parseFloat(exAmount) || 0) * exRate).toFixed(2)

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: c.bg }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ff3465" />}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting}, {user?.firstName ?? 'there'} 👋</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.firstName?.[0] ?? 'N')}{(user?.lastName?.[0] ?? 'B')}</Text>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.totalBalance}>
            <Text style={styles.totalLabel}>Total across all accounts</Text>
            <TouchableOpacity onPress={() => setBalanceHidden(v => !v)} activeOpacity={0.8}>
              <Text style={styles.totalAmount}>
                {balanceHidden ? '•••••••' : `£${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Account cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width - 48}
            decelerationRate="fast" contentContainerStyle={styles.cardsScroll}
            onMomentumScrollEnd={e => setActiveAccount(Math.round(e.nativeEvent.contentOffset.x / (width - 48)))}>
            {displayAccounts.map((account: any, i: number) => (
              <Animated.View key={account.id} entering={FadeInDown.delay(100 + i * 60).springify()}>
                <LinearGradient colors={account.colors} style={styles.accountCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.accountCardTop}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountDots}>●●●●</Text>
                  </View>
                  <Text style={styles.accountBalance}>
                    {balanceHidden ? '•••••••' : `£${parseFloat(account.balance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                  </Text>
                  <View style={styles.accountCardBottom}>
                    <Text style={styles.accountMeta}>•••• {account.accountNumber?.slice(-4) ?? '0000'}</Text>
                    <Text style={styles.accountMeta}>{account.sortCode}</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}
          </ScrollView>

          {displayAccounts.length > 1 && (
            <View style={styles.dots}>
              {displayAccounts.map((_: any, i: number) => (
                <View key={i} style={[styles.dot, i === activeAccount && styles.dotActive]} />
              ))}
            </View>
          )}
        </LinearGradient>

        {/* ── Quick actions ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.actions, { backgroundColor: c.surface }]}>
          {[
            { icon: '↑', label: 'Send',     color: '#ff3465', onPress: () => setSendOpen(true) },
            { icon: '+', label: 'Add',      color: '#7b2ff7', onPress: () => setAddOpen(true) },
            { icon: '⇄', label: 'Exchange', color: '#11998e', onPress: () => setExchangeOpen(true) },
            { icon: '₿', label: 'Crypto',   color: '#f7971e', onPress: () => navigation.navigate('Crypto') },
          ].map(({ icon, label, color, onPress }) => (
            <TouchableOpacity key={label} style={styles.actionItem} activeOpacity={0.7} onPress={onPress}>
              <View style={[styles.actionIcon, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
                <Text style={[styles.actionEmoji, { color }]}>{icon}</Text>
              </View>
              <Text style={[styles.actionLabel, { color: c.textSub }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Spending chart ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Spending this month</Text>
          <View style={[styles.chartCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.chartRow}>
              <View style={styles.donutWrap}>
                <DonutChart categories={displayInsights.categories} />
                <View style={styles.donutCenter}>
                  <Text style={[styles.donutTotal, { color: c.text }]}>£{Math.round(displayInsights.total)}</Text>
                  <Text style={[styles.donutLabel, { color: c.textTertiary }]}>total</Text>
                </View>
              </View>
              <View style={styles.legend}>
                {displayInsights.categories.slice(0, 5).map((cat: any) => (
                  <View key={cat.name} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={[styles.legendName, { color: c.textSub }]} numberOfLines={1}>{cat.name}</Text>
                    <Text style={[styles.legendPct, { color: c.textTertiary }]}>{cat.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Savings pots ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(210).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Savings pots</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DEMO_POTS.map(pot => (
              <TouchableOpacity key={pot.name} activeOpacity={0.8}
                onPress={() => { setActivePot(pot); setPotDone(false); setPotTopup('25') }}
                style={[styles.potCard, { borderColor: `${pot.color}30`, backgroundColor: `${pot.color}10` }]}>
                <Text style={styles.potEmoji}>{pot.emoji}</Text>
                <Text style={[styles.potName, { color: c.text }]}>{pot.name}</Text>
                <Text style={[styles.potBalance, { color: pot.color }]}>£{pot.balance.toLocaleString()}</Text>
                <View style={styles.potBar}>
                  <View style={[styles.potFill, { width: `${(pot.balance / pot.target) * 100}%` as any, backgroundColor: pot.color }]} />
                </View>
                <Text style={[styles.potTarget, { color: c.textTertiary }]}>of £{pot.target.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => { setNewPotOpen(true); setNewPotDone(false); setNewPotName(''); setNewPotTarget(''); setNewPotEmoji('🏖️') }}
              style={[styles.potCard, styles.potAdd, { backgroundColor: c.border, borderColor: c.borderSub }]}>
              <Text style={[styles.potAddIcon, { color: c.textTertiary }]}>+</Text>
              <Text style={[styles.potAddLabel, { color: c.textTertiary }]}>New pot</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* ── Recent transactions ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Recent</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {displayTransactions.map((tx: any, i: number) => {
            const isIn = tx.direction === 'INBOUND'
            return (
              <Animated.View key={tx.id} entering={FadeInRight.delay(i * 35).springify()}
                style={[styles.txItem, { backgroundColor: c.surface }]}>
                <View style={[styles.txIcon, { backgroundColor: isIn ? '#00c85315' : '#ff346512' }]}>
                  <Text style={{ fontSize: 16, color: isIn ? '#00c853' : '#ff3465' }}>{isIn ? '↓' : '↑'}</Text>
                </View>
                <View style={styles.txDetails}>
                  <Text style={[styles.txName, { color: c.text }]} numberOfLines={1}>{tx.merchantName ?? tx.description}</Text>
                  <Text style={[styles.txDate, { color: c.textTertiary }]}>
                    {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: isIn ? '#00c853' : c.text }]}>
                  {isIn ? '+' : '-'}£{parseFloat(tx.amount).toFixed(2)}
                </Text>
              </Animated.View>
            )
          })}
        </Animated.View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SEND SHEET */}
      <BottomSheet visible={sendOpen} onClose={() => resetAndClose(setSendOpen, [() => setSendDone(false), () => setSendRecipient(''), () => setSendAmount(''), () => setSendRef('')])}>
        {sendDone ? (
          <SuccessView emoji="✈️" title="Sent!" sub={`£${sendAmount} is on its way to ${sendRecipient || 'recipient'}`} />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Send money</Text>
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Recipient</Text>
            <TextInput style={[styles.sheetInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
              placeholder="Name, sort code or account number" placeholderTextColor={c.textTertiary}
              value={sendRecipient} onChangeText={setSendRecipient} />
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Amount</Text>
            <AmountPills selected={sendAmount} onSelect={setSendAmount} />
            <TextInput style={[styles.sheetInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border, marginTop: 8 }]}
              placeholder="Or enter custom amount" placeholderTextColor={c.textTertiary} keyboardType="decimal-pad"
              value={sendAmount} onChangeText={setSendAmount} />
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Reference <Text style={{ color: c.textTertiary }}>(optional)</Text></Text>
            <TextInput style={[styles.sheetInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
              placeholder="What's it for?" placeholderTextColor={c.textTertiary}
              value={sendRef} onChangeText={setSendRef} />
            <TouchableOpacity style={[styles.sheetCta, { opacity: sendAmount && sendRecipient ? 1 : 0.4 }]}
              activeOpacity={0.85} disabled={!sendAmount || !sendRecipient}
              onPress={() => setSendDone(true)}>
              <LinearGradient colors={['#ff3465', '#ff6b35']} style={styles.sheetCtaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.sheetCtaText}>Send £{sendAmount || '0'} →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* ADD MONEY SHEET */}
      <BottomSheet visible={addOpen} onClose={() => resetAndClose(setAddOpen, [() => setAddDone(false), () => setAddAmount('50'), () => setAddCustom('')])}>
        {addDone ? (
          <SuccessView emoji="💸" title="Money on its way!" sub={`£${addCustom || addAmount} will appear in your account shortly`} />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Add money</Text>
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>How much?</Text>
            <AmountPills selected={addAmount} onSelect={v => { setAddAmount(v); setAddCustom('') }} />
            <TextInput style={[styles.sheetInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border, marginTop: 8 }]}
              placeholder="Or enter amount" placeholderTextColor={c.textTertiary} keyboardType="decimal-pad"
              value={addCustom} onChangeText={v => { setAddCustom(v); setAddAmount('') }} />
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Your account details</Text>
            <View style={[styles.detailsBox, { backgroundColor: c.bg, borderColor: c.border }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: c.textTertiary }]}>Sort code</Text>
                <Text style={[styles.detailVal, { color: c.text }]}>04-00-04</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailKey, { color: c.textTertiary }]}>Account number</Text>
                <Text style={[styles.detailVal, { color: c.text }]}>00123456</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.sheetCta} activeOpacity={0.85} onPress={() => setAddDone(true)}>
              <LinearGradient colors={['#7b2ff7', '#2193b0']} style={styles.sheetCtaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.sheetCtaText}>Add £{addCustom || addAmount} →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* EXCHANGE SHEET */}
      <BottomSheet visible={exchangeOpen} onClose={() => resetAndClose(setExchangeOpen, [() => setExDone(false)])}>
        {exDone ? (
          <SuccessView emoji="⚡" title="Exchanged!" sub={`£${exAmount} → ${exCurrency.flag} ${exConverted} ${exCurrency.code}`} />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>Exchange currency</Text>
            <View style={[styles.exBox, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[styles.exFlag]}>🇬🇧</Text>
              <TextInput style={[styles.exInput, { color: c.text }]} keyboardType="decimal-pad"
                value={exAmount} onChangeText={setExAmount} placeholder="0" placeholderTextColor={c.textTertiary} />
              <Text style={[styles.exCode, { color: c.textSub }]}>GBP</Text>
            </View>
            <Text style={[styles.exArrow, { color: c.textTertiary }]}>↕</Text>
            <View style={[styles.exBox, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={styles.exFlag}>{exCurrency.flag}</Text>
              <Text style={[styles.exResult, { color: c.text }]}>{exConverted}</Text>
              <View style={styles.exPicker}>
                {CURRENCIES.map(cur => (
                  <TouchableOpacity key={cur.code} onPress={() => setExCurrency(cur)}
                    style={[styles.exCurrBtn, { backgroundColor: exCurrency.code === cur.code ? '#ff346520' : 'transparent' }]}>
                    <Text style={[styles.exCurrText, { color: exCurrency.code === cur.code ? '#ff3465' : c.textSub }]}>{cur.code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={[styles.exRate, { color: c.textTertiary }]}>
              1 GBP = {exCurrency.rate} {exCurrency.code} · live rate
            </Text>
            <TouchableOpacity style={styles.sheetCta} activeOpacity={0.85} onPress={() => setExDone(true)}>
              <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.sheetCtaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.sheetCtaText}>Exchange now →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* POT DETAIL SHEET */}
      <BottomSheet visible={!!activePot} onClose={() => { setActivePot(null); setPotDone(false) }}>
        {activePot && (
          potDone ? (
            <SuccessView emoji={activePot.emoji} title="Added!" sub={`£${potTopup} added to ${activePot.name}`} />
          ) : (
            <View style={styles.sheetContent}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>{activePot.emoji}  {activePot.name}</Text>
              <View style={[styles.potDetailBar, { backgroundColor: c.bg }]}>
                <View style={[styles.potDetailFill, { width: `${(activePot.balance / activePot.target) * 100}%` as any, backgroundColor: activePot.color }]} />
              </View>
              <View style={styles.potDetailMeta}>
                <Text style={[styles.potDetailAmt, { color: c.text }]}>£{activePot.balance.toLocaleString()}</Text>
                <Text style={[styles.potDetailTarget, { color: c.textTertiary }]}>of £{activePot.target.toLocaleString()} · {Math.round((activePot.balance / activePot.target) * 100)}%</Text>
              </View>
              <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Top up</Text>
              <AmountPills selected={potTopup} onSelect={setPotTopup} />
              <TouchableOpacity style={styles.sheetCta} activeOpacity={0.85} onPress={() => setPotDone(true)}>
                <LinearGradient colors={[activePot.color, activePot.color + 'cc']} style={styles.sheetCtaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.sheetCtaText}>Add £{potTopup} to pot →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        )}
      </BottomSheet>

      {/* NEW POT SHEET */}
      <BottomSheet visible={newPotOpen} onClose={() => resetAndClose(setNewPotOpen, [() => setNewPotDone(false)])}>
        {newPotDone ? (
          <SuccessView emoji={newPotEmoji} title="Pot created!" sub={`${newPotName || 'Your pot'} is ready to fill`} />
        ) : (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>New savings pot</Text>
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Choose an emoji</Text>
            <View style={styles.emojiRow}>
              {POT_EMOJIS.map(e => (
                <TouchableOpacity key={e} onPress={() => setNewPotEmoji(e)}
                  style={[styles.emojiBtn, { backgroundColor: newPotEmoji === e ? '#ff346518' : c.bg, borderColor: newPotEmoji === e ? '#ff3465' : c.border }]}>
                  <Text style={styles.emojiBtnText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Name</Text>
            <TextInput style={[styles.sheetInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
              placeholder="e.g. Holiday, Car, House..." placeholderTextColor={c.textTertiary}
              value={newPotName} onChangeText={setNewPotName} />
            <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Target amount (optional)</Text>
            <TextInput style={[styles.sheetInput, { backgroundColor: c.bg, color: c.text, borderColor: c.border }]}
              placeholder="£0" placeholderTextColor={c.textTertiary} keyboardType="decimal-pad"
              value={newPotTarget} onChangeText={setNewPotTarget} />
            <TouchableOpacity style={[styles.sheetCta, { opacity: newPotName ? 1 : 0.4 }]} activeOpacity={0.85}
              disabled={!newPotName} onPress={() => setNewPotDone(true)}>
              <LinearGradient colors={['#ff3465', '#7b2ff7']} style={styles.sheetCtaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.sheetCtaText}>Create {newPotEmoji} {newPotName || 'pot'} →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_WIDTH = width - 48
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  totalBalance: { alignItems: 'center', marginBottom: 20 },
  totalLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 4 },
  totalAmount: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  cardsScroll: { gap: 12, paddingRight: 4 },
  accountCard: { width: CARD_WIDTH, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  accountCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  accountName: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  accountDots: { color: 'rgba(255,255,255,0.3)', fontSize: 6, letterSpacing: 2 },
  accountBalance: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
  accountCardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  accountMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: -14, borderRadius: 22, paddingVertical: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  actionItem: { alignItems: 'center', gap: 7 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actionEmoji: { fontSize: 20, fontWeight: '700' },
  actionLabel: { fontSize: 11, fontWeight: '600' },
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#ff3465', fontWeight: '600', marginBottom: 12 },
  chartCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap: { width: DS, height: DS, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutTotal: { fontSize: 15, fontWeight: '800' },
  donutLabel: { fontSize: 10, marginTop: 1 },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendName: { flex: 1, fontSize: 12 },
  legendPct: { fontSize: 12, fontWeight: '600', minWidth: 30, textAlign: 'right' },
  potCard: { width: 116, marginRight: 10, borderRadius: 16, padding: 14, borderWidth: 1 },
  potAdd: { alignItems: 'center', justifyContent: 'center' },
  potEmoji: { fontSize: 22, marginBottom: 6 },
  potName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  potBalance: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  potBar: { height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)', marginBottom: 4, overflow: 'hidden' },
  potFill: { height: 3, borderRadius: 2 },
  potTarget: { fontSize: 10 },
  potAddIcon: { fontSize: 28, marginBottom: 4 },
  potAddLabel: { fontSize: 12, fontWeight: '600' },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  txIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txDetails: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600' },
  txDate: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  // Sheets
  sheetContent: { paddingHorizontal: 24 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  sheetLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  sheetInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  sheetCta: { marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  sheetCtaGrad: { paddingVertical: 16, alignItems: 'center' },
  sheetCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  pillText: { fontSize: 14, fontWeight: '700' },
  detailsBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailKey: { fontSize: 13 },
  detailVal: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  exBox: { borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  exFlag: { fontSize: 24 },
  exInput: { flex: 1, fontSize: 24, fontWeight: '700' },
  exCode: { fontSize: 14, fontWeight: '600' },
  exResult: { flex: 1, fontSize: 22, fontWeight: '700' },
  exArrow: { textAlign: 'center', fontSize: 22, marginVertical: 8 },
  exPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  exCurrBtn: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  exCurrText: { fontSize: 11, fontWeight: '700' },
  exRate: { fontSize: 12, textAlign: 'center', marginTop: 10 },
  potDetailBar: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  potDetailFill: { height: 10, borderRadius: 5 },
  potDetailMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  potDetailAmt: { fontSize: 20, fontWeight: '800' },
  potDetailTarget: { fontSize: 14 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  emojiBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emojiBtnText: { fontSize: 22 },
  successWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#6b7a99', textAlign: 'center', lineHeight: 22 },
})
