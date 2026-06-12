import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native'
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, FadeInDown, FadeInRight,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../lib/api/client'
import { useAuthStore } from '../lib/stores/auth'
import { useColors } from '../lib/useColors'

const { width } = Dimensions.get('window')

const now = new Date()
const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString()

const DEMO_ACCOUNT = {
  id: 'demo', name: 'Current Account', balance: '4287.50',
  availableBalance: '4102.00', accountNumber: '00123456', sortCode: '04-00-04',
}

const DEMO_TRANSACTIONS = [
  { id: 't1', merchantName: "Sainsbury's",  amount: '34.72',  direction: 'OUTBOUND', createdAt: ago(30) },
  { id: 't2', merchantName: 'Salary — ACME',amount: '3500.00',direction: 'INBOUND',  createdAt: ago(60*18) },
  { id: 't3', merchantName: 'TfL Travel',   amount: '5.60',   direction: 'OUTBOUND', createdAt: ago(60*22) },
  { id: 't4', merchantName: 'Netflix',       amount: '17.99',  direction: 'OUTBOUND', createdAt: ago(60*26) },
  { id: 't5', merchantName: 'Pret a Manger',amount: '8.45',   direction: 'OUTBOUND', createdAt: ago(60*30) },
  { id: 't6', merchantName: 'ASOS',          amount: '89.99',  direction: 'OUTBOUND', createdAt: ago(60*48) },
  { id: 't7', merchantName: 'Deliveroo',     amount: '28.30',  direction: 'OUTBOUND', createdAt: ago(60*72) },
  { id: 't8', merchantName: 'Boots Pharmacy',amount: '22.50', direction: 'OUTBOUND', createdAt: ago(60*96) },
]

export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const user = useAuthStore(s => s.user)
  const [balanceHidden, setBalanceHidden] = useState(false)

  const { data: accounts, isRefetching, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/v1/accounts').then(r => r.data).catch(() => []),
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => api.get('/v1/transactions?limit=8').then(r => r.data).catch(() => []),
  })

  const primaryAccount = accounts?.length ? accounts[0] : DEMO_ACCOUNT
  const displayTransactions = transactions?.length ? transactions : DEMO_TRANSACTIONS
  const balance = parseFloat(primaryAccount.balance)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ff3465" />}
    >
      {/* Header card */}
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
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] ?? 'N')}{(user?.lastName?.[0] ?? 'B')}
            </Text>
          </View>
        </View>

        {/* Balance */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Total balance</Text>
          <TouchableOpacity onPress={() => setBalanceHidden(v => !v)} activeOpacity={0.7}>
            <Text style={styles.balance}>
              {balanceHidden ? '•••••••' : `£${balance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.balanceAvailable}>
            Available: {balanceHidden ? '••••' : `£${parseFloat(primaryAccount.availableBalance).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
          </Text>
        </Animated.View>

        {/* Card info */}
        <View style={styles.cardChip}>
          <Text style={styles.cardNumber}>•••• {primaryAccount.accountNumber?.slice(-4) ?? '0000'}</Text>
          <Text style={styles.cardSort}>{primaryAccount.sortCode}</Text>
        </View>
      </LinearGradient>

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.actions, { backgroundColor: c.surface }]}>
        {[
          { icon: '↑', label: 'Send', color: '#ff3465' },
          { icon: '+', label: 'Add', color: '#7b2ff7' },
          { icon: '⇄', label: 'Exchange', color: '#11998e' },
          { icon: '₿', label: 'Crypto', color: '#f7971e' },
        ].map(({ icon, label, color }) => (
          <TouchableOpacity key={label} style={styles.actionItem} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
              <Text style={[styles.actionEmoji, { color }]}>{icon}</Text>
            </View>
            <Text style={[styles.actionLabel, { color: c.textSub }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Pots preview */}
      <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Savings pots</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.potsScroll}>
          {[
            { emoji: '🏖️', name: 'Holiday', balance: 850, target: 2000, color: '#f7971e' },
            { emoji: '🛡️', name: 'Emergency', balance: 3000, target: 5000, color: '#11998e' },
            { emoji: '💻', name: 'MacBook', balance: 620, target: 1299, color: '#7b2ff7' },
          ].map((pot) => (
            <View key={pot.name} style={[styles.potCard, { borderColor: `${pot.color}30`, backgroundColor: `${pot.color}10` }]}>
              <Text style={styles.potEmoji}>{pot.emoji}</Text>
              <Text style={[styles.potName, { color: c.text }]}>{pot.name}</Text>
              <Text style={[styles.potBalance, { color: pot.color }]}>£{pot.balance.toLocaleString()}</Text>
              <View style={styles.potBar}>
                <View style={[styles.potProgress, { width: `${(pot.balance/pot.target)*100}%` as any, backgroundColor: pot.color }]} />
              </View>
              <Text style={styles.potTarget}>of £{pot.target.toLocaleString()}</Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.potCard, styles.potCardAdd, { backgroundColor: c.border, borderColor: c.borderSub }]}>
            <Text style={styles.potAddIcon}>+</Text>
            <Text style={styles.potAddLabel}>New pot</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Recent transactions */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Recent</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        {displayTransactions.map((tx: any, i: number) => (
          <Animated.View
            key={tx.id}
            entering={FadeInRight.delay(i * 40).springify()}
            style={[styles.txItem, { backgroundColor: c.surface }]}
          >
            <View style={[
              styles.txIcon,
              { backgroundColor: tx.direction === 'INBOUND' ? '#00c85315' : '#ff346512' },
            ]}>
              <Text style={{ fontSize: 16, color: tx.direction === 'INBOUND' ? '#00c853' : '#ff3465' }}>
                {tx.direction === 'INBOUND' ? '↓' : '↑'}
              </Text>
            </View>
            <View style={styles.txDetails}>
              <Text style={[styles.txName, { color: c.text }]} numberOfLines={1}>{tx.merchantName ?? tx.description}</Text>
              <Text style={styles.txDate}>
                {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.direction === 'INBOUND' ? '#00c853' : c.text }]}>
              {tx.direction === 'INBOUND' ? '+' : '-'}£{parseFloat(tx.amount).toFixed(2)}
            </Text>
          </Animated.View>
        ))}
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: { paddingHorizontal: 24, paddingBottom: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 },
  avatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  balanceContainer: { alignItems: 'center', marginBottom: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 6 },
  balance: { color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: -1.5 },
  balanceAvailable: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  cardChip: { flexDirection: 'row', justifyContent: 'space-between' },
  cardNumber: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'monospace' },
  cardSort: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontFamily: 'monospace' },
  actions: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', marginHorizontal: 16,
    marginTop: -16, borderRadius: 22, paddingVertical: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  actionItem: { alignItems: 'center', gap: 7 },
  actionIcon: {
    width: 54, height: 54, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  actionEmoji: { fontSize: 22, fontWeight: '700' },
  actionLabel: { fontSize: 11, color: '#6b7a99', fontWeight: '600' },
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#ff3465', fontWeight: '600' },
  potsScroll: { marginBottom: 4 },
  potCard: {
    width: 120, marginRight: 10, borderRadius: 16, padding: 14,
    borderWidth: 1,
  },
  potCardAdd: {
    backgroundColor: '#f0f2f8', borderColor: '#e2e6f0',
    alignItems: 'center', justifyContent: 'center',
  },
  potEmoji: { fontSize: 22, marginBottom: 6 },
  potName: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 2 },
  potBalance: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  potBar: { height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.08)', marginBottom: 4 },
  potProgress: { height: 3, borderRadius: 2 },
  potTarget: { fontSize: 10, color: '#9aa5be' },
  potAddIcon: { fontSize: 28, color: '#9aa5be', marginBottom: 4 },
  potAddLabel: { fontSize: 12, color: '#9aa5be', fontWeight: '600' },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  txIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txDetails: { flex: 1 },
  txName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txDate: { fontSize: 12, color: '#9aa5be', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
})
