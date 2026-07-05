import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, ScrollView, Image, Alert, Linking,
} from 'react-native'
import Animated, {
  FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import * as Clipboard from 'expo-clipboard'
import { useAuthStore } from '../lib/stores/auth'
import { useSabrinaStore } from '../lib/stores/sabrina'
import type { ChatMessage } from '../lib/stores/sabrina'
import { api } from '../lib/api/client'
import { API_URL } from '../lib/api/url'
import type { SabrinaStreamEvent } from '@netbank/types'

const STARTERS = [
  'How much did I spend last month? 💸',
  "What's my crypto worth right now? 📈",
  'Suggest some music for studying 🎵',
  'Help me build a savings plan 🎯',
]

// ── Media content parsing ─────────────────────────────────────────────────────

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'youtube'; videoId: string }
  | { type: 'image'; url: string }

function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = []
  const regex = /\[youtube:([a-zA-Z0-9_-]{11})\]|\[image:(https?:\/\/[^\]]+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) })
    }
    if (match[1]) {
      parts.push({ type: 'youtube', videoId: match[1] })
    } else if (match[2]) {
      parts.push({ type: 'image', url: match[2] })
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) })
  }

  return parts
}

// ── YouTube card ──────────────────────────────────────────────────────────────

function YouTubeCard({ videoId }: { videoId: string }) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

  function openVideo() {
    Linking.openURL(`vnd.youtube://${videoId}`).catch(() => {
      Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)
    })
  }

  return (
    <TouchableOpacity onPress={openVideo} activeOpacity={0.85} style={styles.youtubeCard}>
      <View style={styles.youtubeThumbnailWrap}>
        <Image source={{ uri: thumbnailUrl }} style={styles.youtubeThumbnail} resizeMode="cover" />
        <View style={styles.youtubePlayOverlay}>
          <View style={styles.youtubePlayBtn}>
            <Text style={styles.youtubePlayIcon}>▶</Text>
          </View>
        </View>
      </View>
      <View style={styles.youtubeFooter}>
        <Text style={styles.youtubeYTLogo}>▶ YouTube</Text>
        <Text style={styles.youtubeTapHint}>Tap to play</Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Bubble content renderer ───────────────────────────────────────────────────

function BubbleContent({ item }: { item: ChatMessage }) {
  const isUser = item.role === 'user'
  const textStyle = isUser ? styles.userText : styles.assistantText

  if (item.error) {
    return (
      <View style={styles.errorInner}>
        <Text style={styles.errorLabel}>⚠ Couldn't respond</Text>
        <Text style={styles.errorBody}>{item.content}</Text>
      </View>
    )
  }

  const parts = parseContent(item.content || '')
  const hasMedia = parts.some(p => p.type === 'youtube' || p.type === 'image')

  return (
    <>
      {item.imageUri && (
        <Image source={{ uri: item.imageUri }} style={styles.attachedImage} resizeMode="cover" />
      )}
      {parts.map((part, i) => {
        if (part.type === 'youtube') {
          return <YouTubeCard key={i} videoId={part.videoId} />
        }
        if (part.type === 'image') {
          return (
            <Image
              key={i}
              source={{ uri: part.url }}
              style={styles.generatedImage}
              resizeMode="cover"
            />
          )
        }
        const trimmed = part.text.trim()
        if (!trimmed && !hasMedia) return null
        return (
          <Text key={i} style={[styles.messageText, textStyle]}>
            {part.text}
          </Text>
        )
      })}
      {(!item.content && item.streaming) && (
        <Text style={[styles.messageText, textStyle, styles.typingDots]}> ●●●</Text>
      )}
      {item.streaming && item.content && <View style={styles.streamingDot} />}
    </>
  )
}

// ── History drawer ────────────────────────────────────────────────────────────

interface HistoryDrawerProps {
  visible: boolean
  onClose: () => void
  onSelect: (id: string) => void
  onNew: () => void
}

function HistoryDrawer({ visible, onClose, onSelect, onNew }: HistoryDrawerProps) {
  const insets = useSafeAreaInsets()
  const tx = useSharedValue(-320)
  const bgOpacity = useSharedValue(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      tx.value = withSpring(0, { damping: 24, stiffness: 220, mass: 0.8 })
      bgOpacity.value = withTiming(1, { duration: 200 })
    } else {
      tx.value = withTiming(-320, { duration: 240 })
      bgOpacity.value = withTiming(0, { duration: 200 })
      const t = setTimeout(() => setMounted(false), 260)
      return () => clearTimeout(t)
    }
  }, [visible])

  const drawerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }))

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['sabrina-conversations'],
    queryFn: () => api.get('/v1/sabrina/conversations').then(r => r.data).catch(() => []),
    enabled: visible,
    staleTime: 0,
  })

  if (!mounted) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.drawer, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }, drawerStyle]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Chat history</Text>
            <TouchableOpacity onPress={onClose} style={styles.drawerClose}>
              <Text style={styles.drawerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newChatBtn} activeOpacity={0.8} onPress={onNew}>
            <Text style={styles.newChatIcon}>+</Text>
            <Text style={styles.newChatText}>New conversation</Text>
          </TouchableOpacity>

          <Text style={styles.drawerSection}>Recent</Text>

          {isLoading ? (
            <ActivityIndicator color="#ff3465" style={{ marginTop: 24 }} />
          ) : conversations?.length === 0 ? (
            <Text style={styles.drawerEmpty}>No saved conversations yet</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {conversations?.map((convo: any) => {
                const lastMsg = convo.messages?.[0]
                const date = new Date(convo.updatedAt)
                const isToday = date.toDateString() === new Date().toDateString()
                const dateStr = isToday
                  ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                  : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                return (
                  <TouchableOpacity key={convo.id} style={styles.convoItem} activeOpacity={0.7}
                    onPress={() => { onSelect(convo.id); onClose() }}>
                    <View style={styles.convoAvatar}>
                      <Text style={styles.convoAvatarText}>✦</Text>
                    </View>
                    <View style={styles.convoInfo}>
                      <Text style={styles.convoTitle} numberOfLines={1}>{convo.title}</Text>
                      {lastMsg && (
                        <Text style={styles.convoPreview} numberOfLines={1}>
                          {lastMsg.role === 'user' ? 'You: ' : 'Sabrina: '}{lastMsg.content}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.convoDate}>{dateStr}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function SabrinaScreen() {
  const insets = useSafeAreaInsets()

  const { conversationId, messages, setConversationId, setMessages, loadConversation, reset } = useSabrinaStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null)
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null)
  const listRef = useRef<FlatList>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const sendScale = useSharedValue(1)
  const sendBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }))

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }, [messages])

  useEffect(() => () => xhrRef.current?.abort(), [])

  async function loadHistory(id: string) {
    try {
      const { data } = await api.get(`/v1/sabrina/conversations/${id}`)
      if (data?.messages) {
        const msgs = data.messages.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
        loadConversation(id, msgs)
      }
    } catch {
      // silently ignore — user will start fresh
    }
  }

  function startNew() {
    xhrRef.current?.abort()
    reset()
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access so you can share images with Sabrina.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPendingImageUri(asset.uri)
      setPendingImageBase64(`data:image/jpeg;base64,${asset.base64}`)
    }
  }

  function clearPendingImage() {
    setPendingImageUri(null)
    setPendingImageBase64(null)
  }

  async function copyMessage(content: string) {
    // Strip embedded tags before copying
    const plain = content.replace(/\[youtube:[a-zA-Z0-9_-]{11}\]/g, '[YouTube video]').replace(/\[image:https?:\/\/[^\]]+\]/g, '[image]')
    await Clipboard.setStringAsync(plain)
  }

  async function sendMessage(text: string) {
    if ((!text.trim() && !pendingImageUri) || loading) return

    const imageUri = pendingImageUri
    const imageBase64 = pendingImageBase64

    const userMsg: ChatMessage = {
      id: Math.random().toString(36),
      role: 'user',
      content: text,
      imageUri: imageUri ?? undefined,
    }
    const assistantId = Math.random().toString(36)
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', streaming: true }

    setMessages(m => [...m, userMsg, assistantMsg])
    setInput('')
    clearPendingImage()
    setLoading(true)

    sendScale.value = withSpring(0.85, { damping: 10 }, () => {
      sendScale.value = withSpring(1, { damping: 10 })
    })

    fireRequest(assistantId, text, imageBase64, false)
  }

  function fireRequest(assistantId: string, text: string, imageBase64: string | null, isRetry: boolean) {
    const token = useAuthStore.getState().accessToken
    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr

    let parseOffset = 0
    let fullText = ''

    xhr.open('POST', `${API_URL}/v1/sabrina/chat`)
    xhr.setRequestHeader('Content-Type', 'application/json')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    const processChunks = () => {
      const chunk = xhr.responseText.slice(parseOffset)
      if (!chunk) return
      parseOffset = xhr.responseText.length

      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6)) as SabrinaStreamEvent & { type: string; message?: string }
          if (event.type === 'message_start' && event.conversationId) {
            setConversationId(event.conversationId)
          }
          if (event.type === 'content_delta' && event.delta) {
            fullText += event.delta
            const snap = fullText
            setMessages(m => m.map(msg => msg.id === assistantId ? { ...msg, content: snap } : msg))
          }
          if (event.type === 'message_end') {
            setMessages(m => m.map(msg => msg.id === assistantId ? { ...msg, streaming: false } : msg))
          }
          if (event.type === 'error') {
            setMessages(m => m.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: event.message ?? 'Server error', streaming: false, error: true }
                : msg
            ))
          }
        } catch {}
      }
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState < 3) return
      processChunks()
      if (xhr.readyState === 4) {
        setLoading(false)
        setMessages(m => m.map(msg =>
          msg.id === assistantId && msg.streaming
            ? { ...msg, streaming: false, content: msg.content || '…' }
            : msg
        ))
      }
    }

    xhr.onload = async () => {
      if (xhr.status === 401 && !isRetry) {
        await useAuthStore.getState().refresh()
        if (useAuthStore.getState().accessToken) {
          setMessages(m => m.map(msg => msg.id === assistantId ? { ...msg, content: '', streaming: true } : msg))
          fireRequest(assistantId, text, imageBase64, true)
          return
        }
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        let detail = `HTTP ${xhr.status}`
        try { detail = JSON.parse(xhr.responseText)?.message ?? detail } catch {}
        setMessages(m => m.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: `Error ${xhr.status}: ${detail}`, streaming: false, error: true }
            : msg
        ))
        setLoading(false)
      }
    }

    xhr.onerror = () => {
      setMessages(m => m.map(msg =>
        msg.id === assistantId
          ? { ...msg, content: "Can't reach the server. Is the API running on port 3000?", streaming: false, error: true }
          : msg
      ))
      setLoading(false)
    }

    xhr.onabort = () => setLoading(false)

    const body: Record<string, unknown> = { message: text, conversationId }
    if (imageBase64) body.images = [imageBase64]

    xhr.send(JSON.stringify(body))
  }

  const canSend = (input.trim().length > 0 || pendingImageUri !== null) && !loading

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setHistoryOpen(true)} style={styles.historyBtn} activeOpacity={0.7}>
            <Text style={styles.historyIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.sabrinaAvatar}>
            <Text style={styles.sabrinaAvatarText}>✦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sabrinaName}>Sabrina</Text>
            <Text style={styles.sabrinaStatus}>
              {loading ? '● Thinking…' : '● Online · Always here'}
            </Text>
          </View>
          {loading ? (
            <TouchableOpacity onPress={() => { xhrRef.current?.abort(); setLoading(false) }} style={styles.stopBtn}>
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startNew} style={styles.stopBtn} activeOpacity={0.7}>
              <Text style={styles.stopText}>New +</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={[styles.messageList, messages.length === 0 && styles.messageListEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyAvatar}>
                <Text style={styles.emptyAvatarText}>✦</Text>
              </View>
              <Text style={styles.emptyTitle}>Hi! I'm Sabrina</Text>
              <Text style={styles.emptySubtitle}>
                I can see all your finances, find music, generate images, and help you make the most of your money.
              </Text>
              <View style={styles.starters}>
                {STARTERS.map(s => (
                  <TouchableOpacity key={s} onPress={() => sendMessage(s)} style={styles.starter} activeOpacity={0.7}>
                    <Text style={styles.starterText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp.delay(index * 20).springify()}
              style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.assistantRow]}
            >
              {item.role === 'assistant' && (
                <View style={[styles.assistantAvatar, item.error && styles.errorAvatar]}>
                  <Text style={{ color: item.error ? '#fff' : '#ff3465', fontSize: 10 }}>
                    {item.error ? '!' : '✦'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => item.content && copyMessage(item.content)}
                delayLongPress={400}
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  item.error && styles.errorBubble,
                ]}
              >
                <BubbleContent item={item} />
              </TouchableOpacity>
            </Animated.View>
          )}
        />

        {/* Pending image preview */}
        {pendingImageUri && (
          <View style={styles.pendingImageRow}>
            <Image source={{ uri: pendingImageUri }} style={styles.pendingImageThumb} />
            <Text style={styles.pendingImageLabel}>Image attached</Text>
            <TouchableOpacity onPress={clearPendingImage} style={styles.pendingImageRemove}>
              <Text style={styles.pendingImageRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity onPress={pickImage} style={styles.attachBtn} activeOpacity={0.7}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={pendingImageUri ? 'Add a message…' : 'Ask Sabrina anything…'}
            placeholderTextColor="#9aa5be"
            multiline
            maxLength={1000}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Animated.View style={sendBtnStyle}>
            <TouchableOpacity
              onPress={() => sendMessage(input)}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.sendIcon}>↑</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <HistoryDrawer
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={loadHistory}
        onNew={() => { setHistoryOpen(false); startNew() }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  historyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  historyIcon: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  sabrinaAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff346520', borderWidth: 1, borderColor: '#ff346540', alignItems: 'center', justifyContent: 'center' },
  sabrinaAvatarText: { color: '#ff3465', fontSize: 18 },
  sabrinaName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  sabrinaStatus: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 },
  stopBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  stopText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  messageList: { padding: 16, gap: 10, flexGrow: 1 },
  messageListEmpty: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 24 },
  emptyAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ff346515', borderWidth: 2, borderColor: '#ff346530', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyAvatarText: { color: '#ff3465', fontSize: 28 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7a99', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  starters: { width: '100%', gap: 8 },
  starter: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e6f0' },
  starterText: { fontSize: 14, color: '#374157', fontWeight: '500' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  assistantAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ff346515', borderWidth: 1, borderColor: '#ff346330', alignItems: 'center', justifyContent: 'center', marginBottom: 2, flexShrink: 0 },
  errorAvatar: { backgroundColor: '#ff346560' },
  bubble: { maxWidth: '85%', borderRadius: 18, padding: 13, overflow: 'hidden' },
  userBubble: { backgroundColor: '#ff3465', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e6f0' },
  errorBubble: { backgroundColor: '#fff5f7', borderColor: '#ffb3c1', padding: 0 },
  errorInner: { padding: 13 },
  errorLabel: { fontSize: 12, fontWeight: '700', color: '#cc2244', marginBottom: 4, letterSpacing: 0.2 },
  errorBody: { fontSize: 14, color: '#7a2233', lineHeight: 20 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  assistantText: { color: '#111827' },
  typingDots: { opacity: 0.4 },
  streamingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff3465', marginTop: 6, opacity: 0.7 },
  // YouTube card
  youtubeCard: { width: 260, borderRadius: 12, overflow: 'hidden', marginVertical: 6, backgroundColor: '#000' },
  youtubeThumbnailWrap: { width: 260, height: 146, position: 'relative' },
  youtubeThumbnail: { width: 260, height: 146 },
  youtubePlayOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  youtubePlayBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,0,0,0.88)', alignItems: 'center', justifyContent: 'center' },
  youtubePlayIcon: { color: '#fff', fontSize: 20, marginLeft: 4 },
  youtubeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#111' },
  youtubeYTLogo: { color: '#ff0000', fontSize: 12, fontWeight: '700' },
  youtubeTapHint: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  // Images
  attachedImage: { width: 220, height: 160, borderRadius: 10, marginBottom: 8 },
  generatedImage: { width: 240, height: 180, borderRadius: 12, marginVertical: 6 },
  // Pending image preview strip
  pendingImageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f2f8' },
  pendingImageThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f0f2f8' },
  pendingImageLabel: { flex: 1, fontSize: 13, color: '#6b7a99' },
  pendingImageRemove: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f2f8', alignItems: 'center', justifyContent: 'center' },
  pendingImageRemoveText: { color: '#6b7a99', fontSize: 12 },
  // Input bar
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f2f8' },
  attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fc', borderWidth: 1, borderColor: '#e2e6f0', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  attachIcon: { fontSize: 18 },
  input: { flex: 1, backgroundColor: '#f8f9fc', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827', maxHeight: 100, borderWidth: 1, borderColor: '#e2e6f0' },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center', shadowColor: '#ff3465', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  sendBtnDisabled: { opacity: 0.35, shadowOpacity: 0 },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  // History drawer
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 300, backgroundColor: '#1a1a2e', paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  drawerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  drawerClose: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  drawerCloseText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ff346520', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 24, borderWidth: 1, borderColor: '#ff346540' },
  newChatIcon: { color: '#ff3465', fontSize: 20, fontWeight: '700' },
  newChatText: { color: '#ff3465', fontSize: 15, fontWeight: '700' },
  drawerSection: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  drawerEmpty: { color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center', marginTop: 32 },
  convoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  convoAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ff346520', borderWidth: 1, borderColor: '#ff346440', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  convoAvatarText: { color: '#ff3465', fontSize: 12 },
  convoInfo: { flex: 1, minWidth: 0 },
  convoTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  convoPreview: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  convoDate: { color: 'rgba(255,255,255,0.25)', fontSize: 10, flexShrink: 0 },
})
