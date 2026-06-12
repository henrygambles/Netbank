import React, { useState } from 'react'
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../lib/api/client'
import { useColors } from '../lib/useColors'
import { formatDistanceToNow } from 'date-fns'

const now = new Date()
const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString()

const DEMO_TRANSACTIONS = [
  { id: 't1',  merchantName: "Sainsbury's",   description: 'Card payment', amount: '34.72',  direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(30) },
  { id: 't2',  merchantName: 'Salary — ACME', description: 'Credit',       amount: '3500.00',direction: 'INBOUND',  merchantCategory: null,            createdAt: ago(60*18) },
  { id: 't3',  merchantName: 'TfL Travel',    description: 'Card payment', amount: '5.60',   direction: 'OUTBOUND', merchantCategory: 'Transport',     createdAt: ago(60*22) },
  { id: 't4',  merchantName: 'Netflix',        description: 'Subscription', amount: '17.99',  direction: 'OUTBOUND', merchantCategory: 'Entertainment', createdAt: ago(60*26) },
  { id: 't5',  merchantName: 'Pret a Manger', description: 'Card payment', amount: '8.45',   direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60*30) },
  { id: 't6',  merchantName: 'ASOS',           description: 'Card payment', amount: '89.99',  direction: 'OUTBOUND', merchantCategory: 'Shopping',      createdAt: ago(60*48) },
  { id: 't7',  merchantName: 'Boots Pharmacy', description: 'Card payment', amount: '22.50',  direction: 'OUTBOUND', merchantCategory: 'Health',        createdAt: ago(60*52) },
  { id: 't8',  merchantName: 'Uber Eats',      description: 'Card payment', amount: '28.30',  direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60*72) },
  { id: 't9',  merchantName: 'Waitrose',        description: 'Card payment', amount: '61.14',  direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60*96) },
  { id: 't10', merchantName: 'Deliveroo',       description: 'Card payment', amount: '19.50',  direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60*120) },
  { id: 't11', merchantName: 'Spotify',         description: 'Subscription', amount: '11.99',  direction: 'OUTBOUND', merchantCategory: 'Entertainment', createdAt: ago(60*144) },
  { id: 't12', merchantName: 'Costa Coffee',    description: 'Card payment', amount: '4.85',   direction: 'OUTBOUND', merchantCategory: 'Food',          createdAt: ago(60*150) },
]

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f7971e', Transport: '#2193b0', Shopping: '#7b2ff7',
  Entertainment: '#e91e63', Health: '#11998e',
}

export function TransactionsScreen() {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const [search, setSearch] = useState('')

  const { data: transactions, refetch, isRefetching } = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: () => api.get('/v1/transactions?limit=50').then(r => r.data).catch(() => []),
  })

  const allTransactions = transactions?.length ? transactions : DEMO_TRANSACTIONS
  const filtered = search
    ? allTransactions.filter((t: any) =>
        (t.merchantName ?? t.description).toLowerCase().includes(search.toLowerCase())
      )
    : allTransactions

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.borderSub }]}>
        <Text style={[styles.title, { color: c.text }]}>Transactions</Text>
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

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ff3465" />}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }: any) => {
          const isIn = item.direction === 'INBOUND'
          const catColor = CATEGORY_COLORS[item.merchantCategory ?? ''] ?? '#6b7a99'
          return (
            <Animated.View entering={FadeInRight.delay(index * 25).springify()}>
              <TouchableOpacity style={[styles.txItem, { backgroundColor: c.surface, borderColor: c.border }]} activeOpacity={0.7}>
                <View style={[styles.txIcon, { backgroundColor: isIn ? '#00c85315' : `${catColor}15` }]}>
                  <Text style={[styles.txIconText, { color: isIn ? '#00c853' : catColor }]}>
                    {isIn ? '↓' : '↑'}
                  </Text>
                </View>
                <View style={styles.txDetails}>
                  <Text style={[styles.txName, { color: c.text }]} numberOfLines={1}>{item.merchantName ?? item.description}</Text>
                  <View style={styles.txMeta}>
                    {item.merchantCategory && (
                      <View style={[styles.catBadge, { backgroundColor: `${catColor}18` }]}>
                        <Text style={[styles.catText, { color: catColor }]}>{item.merchantCategory}</Text>
                      </View>
                    )}
                    <Text style={[styles.txTime, { color: c.textTertiary }]}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: isIn ? '#00c853' : c.text }]}>
                  {isIn ? '+' : '-'}£{parseFloat(item.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f8',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f8f9fc', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#e2e6f0',
  },
  searchIcon: { fontSize: 16, color: '#9aa5be' },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  clearIcon: { fontSize: 14, color: '#9aa5be', paddingHorizontal: 4 },
  list: { padding: 16, gap: 8 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#e2e6f0',
  },
  txIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 18, fontWeight: '700' },
  txDetails: { flex: 1 },
  txName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  catText: { fontSize: 10, fontWeight: '700' },
  txTime: { fontSize: 11, color: '#9aa5be' },
  txAmount: { fontSize: 16, fontWeight: '700' },
})
