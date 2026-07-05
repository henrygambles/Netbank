import React, { useCallback, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api/client'
import { API_URL } from '../lib/api/url'
import { useColors } from '../lib/useColors'

interface Props {
  onDone: () => void
  onSkip?: () => void
}

const PLAID_HOSTED = 'https://cdn.plaid.com/link/v2/stable/link.html'

// Plaid's dashboard only accepts https:// redirect URIs — custom schemes are rejected.
// Use localhost for dev: registered in Plaid dashboard, and ASWebAuthenticationSession
// (which runs in Safari's process, bypassing app ATS) can reach the host Mac's localhost.
const REDIRECT_URI = __DEV__
  ? 'http://localhost:3000/v1/open-banking/oauth-callback'
  : `${API_URL}/v1/open-banking/oauth-callback`

// For Phase 2 we open our own backend page (not Plaid's hosted link). Plaid's hosted
// link page shows a success screen after account selection but never redirects, so
// ASWebAuthenticationSession ends as 'cancel'. Our page uses the JS SDK whose
// onSuccess callback can navigate to netbank:// which ASWebAuthenticationSession intercepts.
const LINK_PAGE = __DEV__
  ? 'http://localhost:3000/v1/open-banking/link-page'
  : `${API_URL}/v1/open-banking/link-page`

async function getLinkToken() {
  const { data } = await api.get('/v1/open-banking/link-token', {
    params: { redirectUri: REDIRECT_URI },
  })
  return data.linkToken as string
}

async function exchangeAndRefresh(
  publicToken: string,
  meta: { institutionId: string; institutionName: string },
  qc: ReturnType<typeof useQueryClient>,
  setConnecting: (v: boolean) => void,
) {
  setConnecting(true)
  await api.post('/v1/open-banking/exchange', {
    publicToken,
    institutionId: meta.institutionId,
    institutionName: meta.institutionName,
  })
  await qc.invalidateQueries({ queryKey: ['ob-connections'] })
  await qc.invalidateQueries({ queryKey: ['ob-transactions'] })
  setConnecting(false)
}

export function ConnectBankScreen({ onDone, onSkip }: Props) {
  const insets = useSafeAreaInsets()
  const c = useColors()
  const qc = useQueryClient()
  const [connecting, setConnecting] = useState(false)

  const { data: connections, isLoading } = useQuery({
    queryKey: ['ob-connections'],
    queryFn: () => api.get('/v1/open-banking/connections').then(r => r.data).catch(() => []),
  })

  const openLink = useCallback(async () => {
    try {
      setConnecting(true)
      const linkToken = await getLinkToken()
      setConnecting(false)

      // Phase 1 — Plaid's hosted link page handles bank selection + OAuth redirect.
      const url1 = `${PLAID_HOSTED}?token=${linkToken}`
      const result1 = await WebBrowser.openAuthSessionAsync(url1, 'netbank://ob-callback')
      if (result1.type !== 'success') return

      // Our server maps Plaid's snake_case params → camelCase in the netbank:// redirect.
      const parsed1 = new URL(result1.url)
      if (parsed1.searchParams.get('cancelled')) return

      // Non-OAuth bank: server maps public_token → publicToken.
      const publicToken1 = parsed1.searchParams.get('publicToken')
      if (publicToken1) {
        await exchangeAndRefresh(publicToken1, {
          institutionId: parsed1.searchParams.get('institutionId') ?? '',
          institutionName: parsed1.searchParams.get('institutionName') ?? 'Bank',
        }, qc, setConnecting)
        return
      }

      // OAuth bank (UK): server maps oauth_state_id → oauthStateId.
      // Phase 2 uses our own link-page (Plaid JS SDK) so onSuccess fires a netbank://
      // redirect — Plaid's hosted link page never redirects after Phase 2 completion.
      const oauthStateId = parsed1.searchParams.get('oauthStateId')
      if (oauthStateId) {
        setConnecting(true)
        const linkToken2 = await getLinkToken()
        setConnecting(false)

        // Reconstruct the original Plaid redirect URI so Plaid can look up its OAuth state.
        const receivedRedirectUri = `${REDIRECT_URI}?oauth_state_id=${oauthStateId}`
        const url2 = `${LINK_PAGE}?token=${encodeURIComponent(linkToken2)}&receivedRedirectUri=${encodeURIComponent(receivedRedirectUri)}`
        const result2 = await WebBrowser.openAuthSessionAsync(url2, 'netbank://ob-callback')
        if (result2.type !== 'success') return

        // Our page's onSuccess sends snake_case params directly (no server remapping).
        const parsed2 = new URL(result2.url)
        if (parsed2.searchParams.get('cancelled')) return

        const publicToken2 = parsed2.searchParams.get('public_token')
        if (publicToken2) {
          await exchangeAndRefresh(publicToken2, {
            institutionId: parsed2.searchParams.get('institution_id') ?? '',
            institutionName: parsed2.searchParams.get('institution_name') ?? 'Bank',
          }, qc, setConnecting)
        }
      }
    } catch (e: any) {
      setConnecting(false)
      Alert.alert('Connection failed', e?.message ?? 'Please try again.')
    }
  }, [qc])

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Animated.View entering={FadeInUp.springify()}>
          <Text style={styles.headerEmoji}>🏦</Text>
          <Text style={styles.headerTitle}>Connected Banks</Text>
          <Text style={styles.headerSub}>
            Securely connect your bank accounts via Open Banking. Read-only access — we never see your password.
          </Text>
          {(connections?.length ?? 0) > 0 && (
            <View style={styles.connectedPill}>
              <Text style={styles.connectedPillText}>
                ✓ {connections.length} bank{connections.length !== 1 ? 's' : ''} connected
              </Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Connection list */}
      <FlatList
        data={connections ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { flexGrow: 1 }]}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏛️</Text>
              <Text style={[styles.emptyTitle, { color: c.text }]}>No banks connected yet</Text>
              <Text style={[styles.emptySub, { color: c.textSub }]}>
                Tap the button below to securely connect your first bank account.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#ff3465" />
            </View>
          )
        }
        renderItem={({ item: conn, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <View style={[styles.connRow, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.connIconWrap}>
                <Text style={styles.connEmoji}>🏦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.connName, { color: c.text }]}>{conn.institutionName}</Text>
                <Text style={[styles.connMeta, { color: c.textTertiary }]}>
                  {conn.accounts?.length ?? 0} account{conn.accounts?.length !== 1 ? 's' : ''}
                  {' · '}
                  <Text style={{ color: conn.status === 'ACTIVE' ? '#00c853' : '#ff3465' }}>
                    {conn.status === 'ACTIVE' ? '✓ Active' : '⚠ Reconnect needed'}
                  </Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      />

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopColor: c.border }]}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openLink}
          disabled={connecting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#ff3465', '#ff6b35']}
            style={styles.addBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {connecting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.addBtnText}>+ Add a bank</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {((connections?.length ?? 0) > 0 || onSkip) && (
          <TouchableOpacity
            onPress={(connections?.length ?? 0) > 0 ? onDone : onSkip}
            style={{ marginTop: 8 }}
          >
            <Text style={[styles.secondaryAction, { color: c.textTertiary }]}>
              {(connections?.length ?? 0) > 0 ? 'Done →' : 'Skip for now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerEmoji: { fontSize: 36, marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 10 },
  headerSub: { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 22 },
  connectedPill: { marginTop: 14, alignSelf: 'flex-start', backgroundColor: 'rgba(0,200,83,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  connectedPillText: { color: '#00c853', fontSize: 13, fontWeight: '600' },
  list: { padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub: { fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 16 },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1 },
  connIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#ff346518', alignItems: 'center', justifyContent: 'center' },
  connEmoji: { fontSize: 22 },
  connName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  connMeta: { fontSize: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  addBtn: { borderRadius: 16, overflow: 'hidden' },
  addBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryAction: { textAlign: 'center', fontSize: 14, paddingVertical: 4 },
})
