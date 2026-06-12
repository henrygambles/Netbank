import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../lib/api/client'
import { useColors } from '../lib/useColors'

const FEATURED = ['BTC', 'ETH', 'SOL', 'XMR', 'BNB', 'ADA', 'DOGE', 'MATIC']

const DEMO_PRICES = [
  { currency: 'BTC',  priceUSD: '67842.50', change24h:  2.34 },
  { currency: 'ETH',  priceUSD: '3521.18',  change24h:  1.87 },
  { currency: 'SOL',  priceUSD: '178.43',   change24h:  4.12 },
  { currency: 'XMR',  priceUSD: '162.77',   change24h: -0.95 },
  { currency: 'BNB',  priceUSD: '602.34',   change24h:  1.23 },
  { currency: 'ADA',  priceUSD: '0.4821',   change24h: -1.44 },
  { currency: 'DOGE', priceUSD: '0.1632',   change24h:  5.81 },
  { currency: 'MATIC',priceUSD: '0.7163',   change24h:  3.07 },
]

const DEMO_PORTFOLIO = {
  totalGBP: 2847.32,
  totalUSD: 3609.54,
  wallets: [
    { currency: 'BTC', balance: '0.02418500', valueFiat: '1,641.14' },
    { currency: 'ETH', balance: '0.34120000', valueFiat: '852.11' },
    { currency: 'SOL', balance: '2.15000000', valueFiat: '242.74' },
    { currency: 'XMR', balance: '0.68000000', valueFiat: '111.33' },
  ],
}

const CURRENCY_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', XMR: '#ff6600',
  BNB: '#f3ba2f', ADA: '#0d1e30', DOGE: '#c2a633', MATIC: '#8247e5',
}

export function CryptoScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [tab, setTab] = useState<'portfolio' | 'market'>('market')

  const { data: portfolio, refetch, isRefetching } = useQuery({
    queryKey: ['crypto-portfolio'],
    queryFn: () => api.get('/v1/crypto/portfolio').then(r => r.data).catch(() => null),
    refetchInterval: 60_000,
  })

  const { data: prices } = useQuery({
    queryKey: ['crypto-prices'],
    queryFn: () => api.get('/v1/crypto/prices?currencies=' + FEATURED.join(',')).then(r => r.data).catch(() => []),
    placeholderData: DEMO_PRICES,
    refetchInterval: 30_000,
  })

  const displayPortfolio = portfolio ?? DEMO_PORTFOLIO
  const displayPrices = prices?.length ? prices : DEMO_PRICES

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ff3465" />}
    >
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Crypto</Text>
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Portfolio value</Text>
          <Text style={styles.portfolioValue}>
            £{displayPortfolio.totalGBP.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.portfolioUSD}>
            ${displayPortfolio.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.portfolioChange}>
            <Text style={styles.portfolioChangeText}>↑ 3.2% today</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: c.surface, borderColor: c.border }]}>
        {(['market', 'portfolio'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, { color: c.textSub }, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {tab === 'market' ? (
          displayPrices.map((p: any, i: number) => {
            const up = p.change24h >= 0
            const color = CURRENCY_COLORS[p.currency] ?? '#6b7a99'
            const price = parseFloat(p.priceUSD)
            return (
              <Animated.View key={p.currency} entering={FadeInDown.delay(i * 40).springify()} style={[styles.marketCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.coinIcon, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.coinSymbol, { color }]}>{p.currency.slice(0, 2)}</Text>
                </View>
                <View style={styles.coinInfo}>
                  <Text style={[styles.coinName, { color: c.text }]}>{p.currency}</Text>
                  <Text style={[styles.change, { color: up ? '#00c853' : '#ff3465' }]}>
                    {up ? '↑' : '↓'} {Math.abs(p.change24h).toFixed(2)}%
                  </Text>
                </View>
                <Text style={[styles.price, { color: c.text }]}>
                  ${price >= 1000
                    ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 4 : 2 })}
                </Text>
              </Animated.View>
            )
          })
        ) : (
          displayPortfolio.wallets.map((w: any, i: number) => {
            const color = CURRENCY_COLORS[w.currency] ?? '#6b7a99'
            return (
              <Animated.View key={w.currency} entering={FadeInDown.delay(i * 50).springify()} style={[styles.marketCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.coinIcon, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.coinSymbol, { color }]}>{w.currency.slice(0, 2)}</Text>
                </View>
                <View style={styles.coinInfo}>
                  <Text style={[styles.coinName, { color: c.text }]}>{w.currency}</Text>
                  <Text style={styles.coinBalance} numberOfLines={1}>{parseFloat(w.balance).toFixed(6)}</Text>
                </View>
                <Text style={[styles.price, { color: c.text }]}>£{w.valueFiat}</Text>
              </Animated.View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  portfolioCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  portfolioLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 },
  portfolioValue: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  portfolioUSD: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 2 },
  portfolioChange: {
    marginTop: 12, alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,200,83,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  portfolioChangeText: { color: '#00c853', fontSize: 13, fontWeight: '600' },
  tabs: {
    flexDirection: 'row', margin: 16, backgroundColor: '#fff',
    borderRadius: 14, padding: 4, borderWidth: 1, borderColor: '#e2e6f0',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#ff3465' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7a99' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  marketCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#e2e6f0',
  },
  coinIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  coinSymbol: { fontSize: 13, fontWeight: '800' },
  coinInfo: { flex: 1 },
  coinName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  change: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  coinBalance: { fontSize: 12, color: '#9aa5be', fontFamily: 'monospace', marginTop: 1 },
  price: { fontSize: 16, fontWeight: '700', color: '#111827' },
})
