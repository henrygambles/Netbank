import React, { useState } from 'react'
import {
  View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity,
  RefreshControl, ScrollView,
} from 'react-native'
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { api } from '../lib/api/client'
import { useColors } from '../lib/useColors'
import { BottomSheet } from '../components/BottomSheet'

// ── Tx detail sheet ───────────────────────────────────────────────────────────

interface TxDetailProps {
  tx: any
  onClose: () => void
}

function TxDetailSheet({ tx, onClose }: TxDetailProps) {
  const c = useColors()
  if (!tx) return null
  const isIn = tx.amount > 0
  const hasLocation = tx.merchantLat && tx.merchantLon
  const catColor = CATEGORY_COLORS[tx.category ?? ''] ?? '#6b7a99'

  const openMaps = () => {
    const q = tx.merchantAddress
      ? encodeURIComponent(tx.merchantAddress)
      : `${tx.merchantLat},${tx.merchantLon}`
    Linking.openURL(`https://maps.google.com/maps?q=${q}`)
  }

  return (
    <BottomSheet visible={!!tx} onClose={onClose}>
      <View style={styles.detailWrap}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <View style={[styles.detailIcon, { backgroundColor: `${catColor}18` }]}>
            <Text style={styles.detailEmoji}>{tx.categoryEmoji ?? '💳'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.detailMerchant, { color: c.text }]} numberOfLines={1}>{tx.merchantName || tx.description}</Text>
            <Text style={[styles.detailCategory, { color: catColor }]}>{tx.category ?? 'Other'}</Text>
          </View>
          <Text style={[styles.detailAmount, { color: isIn ? '#00c853' : c.text }]}>
            {isIn ? '+' : '-'}£{Math.abs(parseFloat(tx.amount)).toFixed(2)}
          </Text>
        </View>

        {/* Details grid */}
        {[
          { label: 'Date', value: new Date(tx.timestamp).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
          { label: 'Time', value: new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
          { label: 'Account', value: tx.account?.displayName },
          { label: 'Bank', value: tx.account?.connection?.institutionName ?? tx.account?.providerName },
          { label: 'Currency', value: tx.currency },
          tx.runningBalance ? { label: 'Balance after', value: `£${parseFloat(tx.runningBalance).toFixed(2)}` } : null,
          { label: 'Reference', value: tx.description },
        ].filter(Boolean).map((row: any) => row?.value ? (
          <View key={row.label} style={[styles.detailRow, { borderColor: c.border }]}>
            <Text style={[styles.detailLabel, { color: c.textTertiary }]}>{row.label}</Text>
            <Text style={[styles.detailValue, { color: c.text }]} numberOfLines={2}>{row.value}</Text>
          </View>
        ) : null)}

        {/* Google Maps */}
        {hasLocation && (
          <TouchableOpacity style={[styles.mapsBtn, { backgroundColor: '#4285F420', borderColor: '#4285F440' }]} onPress={openMaps} activeOpacity={0.8}>
            <Text style={styles.mapsIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapsBtnText, { color: '#4285F4' }]}>View on Google Maps</Text>
              {tx.merchantAddress && <Text style={[styles.mapsAddress, { color: c.textTertiary }]} numberOfLines={1}>{tx.merchantAddress}</Text>}
            </View>
            <Text style={{ color: '#4285F4', fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  )
}

// ── Category colours ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#11998e', 'Eating Out': '#f7971e', Coffee: '#a0522d',
  Transport: '#2193b0', Shopping: '#7b2ff7', Subscriptions: '#e91e63',
  Bills: '#1565c0', Health: '#43a047', Travel: '#0097a7', Petrol: '#f44336',
  Drinks: '#e65100', Cash: '#546e7a', Education: '#7b1fa2',
  Income: '#00c853', Transfer: '#607d8b', 'Personal Care': '#c2185b', Other: '#6b7a99',
}

const CATEGORIES = ['All', 'Groceries', 'Eating Out', 'Shopping', 'Transport', 'Bills', 'Subscriptions', 'Health', 'Travel', 'Income']

// ── Screen ────────────────────────────────────────────────────────────────────

export function TransactionsScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const navigation = useNavigation<any>()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedTx, setSelectedTx] = useState<any>(null)

  const { data: obTxs, isRefetching, refetch } = useQuery({
    queryKey: ['ob-transactions'],
    queryFn: () => api.get('/v1/open-banking/transactions?limit=200').then(r => r.data).catch(() => []),
    staleTime: 30_000,
  })

  const { data: connections } = useQuery({
    queryKey: ['ob-connections'],
    queryFn: () => api.get('/v1/open-banking/connections').then(r => r.data).catch(() => []),
  })

  const hasConnections = connections?.length > 0
  const hasData = obTxs?.length > 0
  const expiredConnections = (connections ?? []).filter((c: any) => c.status === 'EXPIRED')

  const reconnect = () => {
    navigation.navigate('ConnectBank')
  }

  // Filter
  const filtered = (obTxs ?? []).filter((tx: any) => {
    const matchesSearch = !search || (tx.merchantName ?? tx.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesCat = selectedCategory === 'All' || tx.category === selectedCategory
    return matchesSearch && matchesCat
  })

  // Group by date
  const grouped = filtered.reduce((groups: any, tx: any) => {
    const date = new Date(tx.timestamp).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {} as Record<string, any[]>)

  const sections = Object.entries(grouped).map(([date, txs]) => ({ date, txs }))

  // Trigger sync
  const triggerSync = async () => {
    await api.post('/v1/open-banking/sync').catch(() => {})
    setTimeout(() => qc.invalidateQueries({ queryKey: ['ob-transactions'] }), 3000)
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.borderSub }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: c.text }]}>Transactions</Text>
          <TouchableOpacity onPress={triggerSync} style={[styles.syncBtn, { backgroundColor: c.bg }]}>
            <Text style={[styles.syncText, { color: c.textTertiary }]}>↻ Sync</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: c.bg, borderColor: c.border }]}>
          <Text style={[styles.searchIcon, { color: c.textTertiary }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions…"
            placeholderTextColor={c.textTertiary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={[styles.clearIcon, { color: c.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Expired connection re-auth banners */}
      {expiredConnections.map((conn: any) => (
        <Animated.View key={conn.id} entering={FadeInDown.springify()}>
          <TouchableOpacity
            style={styles.expiredBanner}
            activeOpacity={0.8}
            onPress={() => reconnect(conn)}
          >
            <Text style={styles.expiredIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.expiredTitle}>{conn.institutionName} access expired</Text>
              <Text style={styles.expiredSub}>Tap to reconnect in one tap</Text>
            </View>
            <Text style={styles.expiredCta}>Reconnect →</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsScroll}
        contentContainerStyle={styles.pills}
      >
        {CATEGORIES.map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => setSelectedCategory(item)}
            style={[styles.pill, {
              backgroundColor: selectedCategory === item ? '#ff3465' : c.surface,
              borderColor: selectedCategory === item ? '#ff3465' : c.border,
            }]}
          >
            <Text style={[styles.pillText, { color: selectedCategory === item ? '#fff' : c.textSub }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* No connections state */}
      {!hasConnections && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏦</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>Connect your bank</Text>
          <Text style={[styles.emptySub, { color: c.textSub }]}>
            Link your accounts to see all your real transactions here.
          </Text>
          <TouchableOpacity style={styles.connectBtn} onPress={() => navigation.navigate('ConnectBank')}>
            <Text style={styles.connectBtnText}>Connect a bank →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Has connections but no data yet */}
      {hasConnections && !hasData && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⏳</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>Syncing your transactions…</Text>
          <Text style={[styles.emptySub, { color: c.textSub }]}>This usually takes a few seconds.</Text>
          <TouchableOpacity style={styles.connectBtn} onPress={() => refetch()}>
            <Text style={styles.connectBtnText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transaction list grouped by date */}
      {hasData && (
        <FlatList
          data={sections}
          keyExtractor={s => s.date}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ff3465" />}
          contentContainerStyle={styles.list}
          renderItem={({ item: section }) => (
            <View>
              <Text style={[styles.dateHeader, { color: c.textTertiary }]}>{section.date}</Text>
              {section.txs.map((tx: any, i: number) => {
                const isIn = tx.amount > 0
                const catColor = CATEGORY_COLORS[tx.category ?? ''] ?? '#6b7a99'
                return (
                  <Animated.View key={tx.id} entering={FadeInRight.delay(i * 20).springify()}>
                    <TouchableOpacity
                      style={[styles.txItem, { backgroundColor: c.surface, borderColor: c.border }]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedTx(tx)}
                    >
                      <View style={[styles.txIcon, { backgroundColor: `${catColor}15` }]}>
                        <Text style={styles.txEmoji}>{tx.categoryEmoji ?? '💳'}</Text>
                      </View>
                      <View style={styles.txDetails}>
                        <Text style={[styles.txName, { color: c.text }]} numberOfLines={1}>
                          {tx.merchantName || tx.description}
                        </Text>
                        <View style={styles.txMeta}>
                          <View style={[styles.catBadge, { backgroundColor: `${catColor}18` }]}>
                            <Text style={[styles.catText, { color: catColor }]}>{tx.category ?? 'Other'}</Text>
                          </View>
                          <Text style={[styles.txBank, { color: c.textTertiary }]}>
                            {tx.account?.connection?.institutionName ?? tx.account?.providerName}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, { color: isIn ? '#00c853' : c.text }]}>
                          {isIn ? '+' : '-'}£{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                        </Text>
                        {tx.merchantLat && <Text style={styles.txLocationPin}>📍</Text>}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )
              })}
            </View>
          )}
        />
      )}

      <TxDetailSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  syncBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  syncText: { fontSize: 13, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  clearIcon: { fontSize: 14, paddingHorizontal: 4 },
  pillsScroll: { flexGrow: 0 },
  pills: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 4 },
  dateHeader: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 8 },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 13, marginBottom: 6, borderWidth: 1 },
  txIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txEmoji: { fontSize: 20 },
  txDetails: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  catText: { fontSize: 10, fontWeight: '700' },
  txBank: { fontSize: 11 },
  txRight: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  txLocationPin: { fontSize: 10 },
  expiredBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ff3465', marginHorizontal: 12, marginTop: 8, borderRadius: 14, padding: 14 },
  expiredIcon: { fontSize: 18 },
  expiredTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  expiredSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  expiredCta: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 24 },
  connectBtn: { backgroundColor: '#ff3465', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Detail sheet
  detailWrap: { paddingHorizontal: 24 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  detailIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  detailEmoji: { fontSize: 24 },
  detailMerchant: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  detailCategory: { fontSize: 13, fontWeight: '600' },
  detailAmount: { fontSize: 20, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, gap: 16 },
  detailLabel: { fontSize: 13, flex: 0.4 },
  detailValue: { fontSize: 13, fontWeight: '600', flex: 0.6, textAlign: 'right' },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 16, marginBottom: 8 },
  mapsIcon: { fontSize: 20 },
  mapsBtnText: { fontSize: 14, fontWeight: '700' },
  mapsAddress: { fontSize: 12, marginTop: 2 },
})
