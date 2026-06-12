import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native'
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, G } from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../lib/api/client'
import { useAuthStore } from '../lib/stores/auth'
import { useColors } from '../lib/useColors'

const { width } = Dimensions.get('window')

const now = new Date()
const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString()

const DEMO_ACCOUNTS = [
  {
    id: 'demo-current',
    name: 'Current Account',
    balance: '4287.50',
    availableBalance: '4102.00',
    accountNumber: '00123456',
    sortCode: '04-00-04',
    colors: ['#ff3465', '#ff6b35'] as [string, string],
  },
  {
    id: 'demo-savings',
    name: 'Savings Account',
    balance: '12500.00',
    availableBalance: '12500.00',
    accountNumber: '00654321',
    sortCode: '04-00-04',
    colors: ['#7b2ff7', '#2193b0'] as [string, string],
  },
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

// ── Donut chart built from SVG stroke-dasharray segments ─────────────────────
const DONUT_SIZE = 120
const DONUT_STROKE = 20
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

function DonutChart({ categories }: { categories: typeof DEMO_INSIGHTS.categories }) {
  let cumulativeAngle = 0
  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      <G rotation={-90} origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}>
        {categories.filter(c => c.percentage > 0).map((cat, i) => {
          const segmentArc = (cat.percentage / 100) * CIRCUMFERENCE
          const rotation = cumulativeAngle
          cumulativeAngle += (cat.percentage / 100) * 360
          return (
            <Circle
              key={i}
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_RADIUS}
              fill="none"
              stroke={cat.color}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${segmentArc} ${CIRCUMFERENCE}`}
              rotation={rotation}
              origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
            />
          )
        })}
      </G>
    </Svg>
  )
}
// ─────────────────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const user = useAuthStore(s => s.user)
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [activeAccount, setActiveAccount] = useState(0)

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

  const totalBalance = displayAccounts.reduce(
    (sum: number, a: any) => sum + parseFloat(a.balance ?? '0'), 0
  )

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ff3465" />}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting}, {user?.firstName ?? 'there'} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] ?? 'N')}{(user?.lastName?.[0] ?? 'B')}
            </Text>
          </View>
        </View>

        {/* Total balance */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.totalBalance}>
          <Text style={styles.totalLabel}>Total across all accounts</Text>
          <TouchableOpacity onPress={() => setBalanceHidden(v => !v)} activeOpacity={0.8}>
            <Text style={styles.totalAmount}>
              {balanceHidden ? '•••••••' : `£${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Account cards carousel ──────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width - 48}
          decelerationRate="fast"
          contentContainerStyle={styles.cardsScroll}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 48))
            setActiveAccount(idx)
          }}
        >
          {displayAccounts.map((account: any, i: number) => (
            <Animated.View key={account.id} entering={FadeInDown.delay(100 + i * 60).springify()}>
              <LinearGradient
                colors={account.colors ?? ['#ff3465', '#ff6b35']}
                style={styles.accountCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.accountCardTop}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountDots}>●●●●</Text>
                </View>
                <Text style={styles.accountBalance}>
                  {balanceHidden
                    ? '•••••••'
                    : `£${parseFloat(account.balance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                </Text>
                <View style={styles.accountCardBottom}>
                  <Text style={styles.accountMeta}>•••• {account.accountNumber?.slice(-4) ?? '0000'}</Text>
                  <Text style={styles.accountMeta}>{account.sortCode}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Dots indicator */}
        {displayAccounts.length > 1 && (
          <View style={styles.dots}>
            {displayAccounts.map((_: any, i: number) => (
              <View key={i} style={[styles.dot, i === activeAccount && styles.dotActive]} />
            ))}
          </View>
        )}
      </LinearGradient>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.actions, { backgroundColor: c.surface }]}>
        {[
          { icon: '↑', label: 'Send',     color: '#ff3465' },
          { icon: '+', label: 'Add',      color: '#7b2ff7' },
          { icon: '⇄', label: 'Exchange', color: '#11998e' },
          { icon: '₿', label: 'Crypto',   color: '#f7971e' },
        ].map(({ icon, label, color }) => (
          <TouchableOpacity key={label} style={styles.actionItem} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
              <Text style={[styles.actionEmoji, { color }]}>{icon}</Text>
            </View>
            <Text style={[styles.actionLabel, { color: c.textSub }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── Spending chart ────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Spending this month</Text>
        <View style={[styles.chartCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.chartRow}>
            {/* Donut */}
            <View style={styles.donutWrap}>
              <DonutChart categories={displayInsights.categories} />
              <View style={styles.donutCenter}>
                <Text style={[styles.donutTotal, { color: c.text }]}>
                  £{Math.round(displayInsights.total)}
                </Text>
                <Text style={[styles.donutLabel, { color: c.textTertiary }]}>total</Text>
              </View>
            </View>
            {/* Legend */}
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

      {/* ── Savings pots ──────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(210).springify()} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Savings pots</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { emoji: '🏖️', name: 'Holiday',   balance: 850,  target: 2000, color: '#f7971e' },
            { emoji: '🛡️', name: 'Emergency', balance: 3000, target: 5000, color: '#11998e' },
            { emoji: '💻', name: 'MacBook',   balance: 620,  target: 1299, color: '#7b2ff7' },
          ].map(pot => (
            <View key={pot.name} style={[styles.potCard, { borderColor: `${pot.color}30`, backgroundColor: `${pot.color}10` }]}>
              <Text style={styles.potEmoji}>{pot.emoji}</Text>
              <Text style={[styles.potName, { color: c.text }]}>{pot.name}</Text>
              <Text style={[styles.potBalance, { color: pot.color }]}>£{pot.balance.toLocaleString()}</Text>
              <View style={styles.potBar}>
                <View style={[styles.potFill, { width: `${(pot.balance / pot.target) * 100}%` as any, backgroundColor: pot.color }]} />
              </View>
              <Text style={[styles.potTarget, { color: c.textTertiary }]}>of £{pot.target.toLocaleString()}</Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.potCard, styles.potAdd, { backgroundColor: c.border, borderColor: c.borderSub }]}>
            <Text style={[styles.potAddIcon, { color: c.textTertiary }]}>+</Text>
            <Text style={[styles.potAddLabel, { color: c.textTertiary }]}>New pot</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* ── Recent transactions ───────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Recent</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        {displayTransactions.map((tx: any, i: number) => {
          const isIn = tx.direction === 'INBOUND'
          return (
            <Animated.View
              key={tx.id}
              entering={FadeInRight.delay(i * 35).springify()}
              style={[styles.txItem, { backgroundColor: c.surface }]}
            >
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
  )
}

const CARD_WIDTH = width - 48

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Total balance
  totalBalance: { alignItems: 'center', marginBottom: 20 },
  totalLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 4 },
  totalAmount: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1 },

  // Account cards
  cardsScroll: { gap: 12, paddingRight: 4 },
  accountCard: {
    width: CARD_WIDTH,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  accountCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  accountName: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  accountDots: { color: 'rgba(255,255,255,0.3)', fontSize: 6, letterSpacing: 2 },
  accountBalance: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
  accountCardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  accountMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'monospace' },

  // Dots indicator
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: '#fff', width: 18 },

  // Quick actions
  actions: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginHorizontal: 16, marginTop: -14, borderRadius: 22, paddingVertical: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  actionItem: { alignItems: 'center', gap: 7 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  actionEmoji: { fontSize: 20, fontWeight: '700' },
  actionLabel: { fontSize: 11, fontWeight: '600' },

  // Section
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#ff3465', fontWeight: '600', marginBottom: 12 },

  // Spending chart
  chartCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap: { width: DONUT_SIZE, height: DONUT_SIZE, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutTotal: { fontSize: 15, fontWeight: '800' },
  donutLabel: { fontSize: 10, marginTop: 1 },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendName: { flex: 1, fontSize: 12 },
  legendPct: { fontSize: 12, fontWeight: '600', minWidth: 30, textAlign: 'right' },

  // Pots
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

  // Transactions
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  txIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txDetails: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600' },
  txDate: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
})
