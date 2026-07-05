import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import Animated, {
  FadeInDown,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../lib/api/client'
import { useColors } from '../lib/useColors'
import { BottomSheet } from '../components/BottomSheet'

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

const COIN_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', XMR: 'Monero',
  BNB: 'BNB', ADA: 'Cardano', DOGE: 'Dogecoin', MATIC: 'Polygon',
}

const FAKE_WEEKLY = (seed: number) =>
  Array.from({ length: 7 }, (_, i) => (seed + Math.sin(i * 1.2 + seed) * seed * 0.08).toFixed(2))

const BUY_AMOUNTS = ['10', '25', '50', '100', '250']

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

interface CoinData { currency: string; priceUSD: string; change24h: number }
interface WalletData { currency: string; balance: string; valueFiat: string }

export function CryptoScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [tab, setTab] = useState<'portfolio' | 'market'>('market')

  // Coin detail sheet
  const [activeCoin, setActiveCoin] = useState<CoinData | null>(null)
  const [coinAction, setCoinAction] = useState<'buy' | 'sell'>('buy')
  const [coinAmount, setCoinAmount] = useState('25')
  const [coinDone, setCoinDone] = useState(false)

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

  function openCoin(coin: CoinData) {
    setActiveCoin(coin)
    setCoinAction('buy')
    setCoinAmount('25')
    setCoinDone(false)
  }

  const price = activeCoin ? parseFloat(activeCoin.priceUSD) : 0
  const coinsForGBP = activeCoin ? (parseFloat(coinAmount) / (price * 0.79)).toFixed(6) : '0'

  return (
    <>
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
            displayPrices.map((p: CoinData, i: number) => {
              const up = p.change24h >= 0
              const color = CURRENCY_COLORS[p.currency] ?? '#6b7a99'
              const pr = parseFloat(p.priceUSD)
              return (
                <TouchableOpacity key={p.currency} activeOpacity={0.75} onPress={() => openCoin(p)}>
                  <Animated.View entering={FadeInDown.delay(i * 40).springify()}
                    style={[styles.marketCard, { backgroundColor: c.surface, borderColor: c.border }]}>
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
                      ${pr >= 1000
                        ? pr.toLocaleString('en-US', { maximumFractionDigits: 0 })
                        : pr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: pr < 1 ? 4 : 2 })}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              )
            })
          ) : (
            displayPortfolio.wallets.map((w: WalletData, i: number) => {
              const color = CURRENCY_COLORS[w.currency] ?? '#6b7a99'
              const matchPrice = displayPrices.find((p: CoinData) => p.currency === w.currency)
              return (
                <TouchableOpacity key={w.currency} activeOpacity={0.75} onPress={() => matchPrice && openCoin(matchPrice)}>
                  <Animated.View entering={FadeInDown.delay(i * 50).springify()}
                    style={[styles.marketCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <View style={[styles.coinIcon, { backgroundColor: `${color}18` }]}>
                      <Text style={[styles.coinSymbol, { color }]}>{w.currency.slice(0, 2)}</Text>
                    </View>
                    <View style={styles.coinInfo}>
                      <Text style={[styles.coinName, { color: c.text }]}>{w.currency}</Text>
                      <Text style={styles.coinBalance} numberOfLines={1}>{parseFloat(w.balance).toFixed(6)}</Text>
                    </View>
                    <Text style={[styles.price, { color: c.text }]}>£{w.valueFiat}</Text>
                  </Animated.View>
                </TouchableOpacity>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* COIN DETAIL SHEET */}
      <BottomSheet visible={!!activeCoin} onClose={() => { setActiveCoin(null); setCoinDone(false) }}>
        {activeCoin && (
          coinDone ? (
            <SuccessView
              emoji={coinAction === 'buy' ? '🚀' : '💰'}
              title={coinAction === 'buy' ? 'Order placed!' : 'Sold!'}
              sub={coinAction === 'buy'
                ? `You're now buying ${coinsForGBP} ${activeCoin.currency} for £${coinAmount}`
                : `${coinsForGBP} ${activeCoin.currency} sold for £${coinAmount}`}
            />
          ) : (
            <View style={styles.sheetContent}>
              {/* Coin header */}
              <View style={styles.coinSheetHeader}>
                <View style={[styles.coinSheetIcon, { backgroundColor: `${CURRENCY_COLORS[activeCoin.currency] ?? '#6b7a99'}18` }]}>
                  <Text style={[styles.coinSheetSymbol, { color: CURRENCY_COLORS[activeCoin.currency] ?? '#6b7a99' }]}>
                    {activeCoin.currency.slice(0, 2)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.coinSheetName, { color: c.text }]}>{COIN_NAMES[activeCoin.currency] ?? activeCoin.currency}</Text>
                  <Text style={[styles.coinSheetTicker, { color: c.textTertiary }]}>{activeCoin.currency}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View>
                  <Text style={[styles.coinSheetPrice, { color: c.text }]}>
                    ${parseFloat(activeCoin.priceUSD) >= 1000
                      ? parseFloat(activeCoin.priceUSD).toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : parseFloat(activeCoin.priceUSD).toFixed(4)}
                  </Text>
                  <Text style={[styles.coinSheetChange, { color: activeCoin.change24h >= 0 ? '#00c853' : '#ff3465' }]}>
                    {activeCoin.change24h >= 0 ? '↑' : '↓'} {Math.abs(activeCoin.change24h).toFixed(2)}% today
                  </Text>
                </View>
              </View>

              {/* Mini sparkline */}
              <View style={[styles.sparklineWrap, { backgroundColor: c.bg, borderColor: c.border }]}>
                {FAKE_WEEKLY(parseFloat(activeCoin.priceUSD)).map((v, i, arr) => {
                  const min = Math.min(...arr.map(Number))
                  const max = Math.max(...arr.map(Number))
                  const h = ((Number(v) - min) / (max - min || 1)) * 40 + 4
                  const up = activeCoin.change24h >= 0
                  return (
                    <View key={i} style={[styles.sparkBar, { height: h, backgroundColor: up ? '#00c853' : '#ff3465', opacity: 0.6 + (i / arr.length) * 0.4 }]} />
                  )
                })}
              </View>

              {/* Buy / Sell toggle */}
              <View style={[styles.actionTabs, { backgroundColor: c.bg }]}>
                {(['buy', 'sell'] as const).map(a => (
                  <TouchableOpacity key={a} onPress={() => setCoinAction(a)}
                    style={[styles.actionTab, coinAction === a && { backgroundColor: a === 'buy' ? '#00c853' : '#ff3465' }]}>
                    <Text style={[styles.actionTabText, { color: coinAction === a ? '#fff' : c.textSub }]}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sheetLabel, { color: c.textTertiary }]}>Amount (GBP)</Text>
              <View style={styles.pills}>
                {BUY_AMOUNTS.map(a => (
                  <TouchableOpacity key={a} onPress={() => setCoinAmount(a)}
                    style={[styles.pill, { borderColor: coinAmount === a ? (coinAction === 'buy' ? '#00c853' : '#ff3465') : c.border, backgroundColor: coinAmount === a ? (coinAction === 'buy' ? '#00c85315' : '#ff346515') : c.bg }]}>
                    <Text style={[styles.pillText, { color: coinAmount === a ? (coinAction === 'buy' ? '#00c853' : '#ff3465') : c.textSub }]}>£{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.coinCalc, { backgroundColor: c.bg, borderColor: c.border }]}>
                <Text style={[styles.coinCalcLabel, { color: c.textTertiary }]}>You'll {coinAction === 'buy' ? 'receive' : 'sell'}</Text>
                <Text style={[styles.coinCalcAmt, { color: c.text }]}>{coinsForGBP} {activeCoin.currency}</Text>
              </View>

              <TouchableOpacity style={styles.sheetCta} activeOpacity={0.85} onPress={() => setCoinDone(true)}>
                <LinearGradient
                  colors={coinAction === 'buy' ? ['#00c853', '#00e676'] : ['#ff3465', '#ff6b35']}
                  style={styles.sheetCtaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.sheetCtaText}>
                    {coinAction === 'buy' ? `Buy ${activeCoin.currency} for £${coinAmount}` : `Sell ${activeCoin.currency} →`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        )}
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  portfolioCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  portfolioLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 },
  portfolioValue: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  portfolioUSD: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 2 },
  portfolioChange: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(0,200,83,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  portfolioChangeText: { color: '#00c853', fontSize: 13, fontWeight: '600' },
  tabs: { flexDirection: 'row', margin: 16, borderRadius: 14, padding: 4, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#ff3465' },
  tabText: { fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  marketCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  coinIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  coinSymbol: { fontSize: 13, fontWeight: '800' },
  coinInfo: { flex: 1 },
  coinName: { fontSize: 15, fontWeight: '700' },
  change: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  coinBalance: { fontSize: 12, color: '#9aa5be', fontFamily: 'monospace', marginTop: 1 },
  price: { fontSize: 16, fontWeight: '700' },
  // Sheet
  sheetContent: { paddingHorizontal: 24 },
  coinSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  coinSheetIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  coinSheetSymbol: { fontSize: 16, fontWeight: '800' },
  coinSheetName: { fontSize: 18, fontWeight: '800' },
  coinSheetTicker: { fontSize: 12, marginTop: 1 },
  coinSheetPrice: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  coinSheetChange: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  sparklineWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 56, borderRadius: 14, borderWidth: 1, padding: 8, marginBottom: 16 },
  sparkBar: { flex: 1, borderRadius: 3, minHeight: 4 },
  actionTabs: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 4 },
  actionTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionTabText: { fontSize: 15, fontWeight: '700' },
  sheetLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  pills: { flexDirection: 'row', gap: 6 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  pillText: { fontSize: 13, fontWeight: '700' },
  coinCalc: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12, alignItems: 'center' },
  coinCalcLabel: { fontSize: 12, marginBottom: 4 },
  coinCalcAmt: { fontSize: 20, fontWeight: '800', fontFamily: 'monospace' },
  sheetCta: { marginTop: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  sheetCtaGrad: { paddingVertical: 16, alignItems: 'center' },
  sheetCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#6b7a99', textAlign: 'center', lineHeight: 22 },
})
