import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import Animated, { FadeInUp, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '../lib/stores/auth'
import type { SabrinaStreamEvent } from '@netbank/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
}

const API_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.netbank.com'

const STARTERS = [
  'How much did I spend last month? 💸',
  "What's my crypto worth right now? 📈",
  'Help me build a savings plan 🎯',
  "How's the market looking today? 🌍",
]

export function SabrinaScreen() {
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const listRef = useRef<FlatList>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const sendScale = useSharedValue(1)

  const sendBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }))

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }, [messages])

  // Cancel any in-flight request when unmounting
  useEffect(() => () => xhrRef.current?.abort(), [])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { id: Math.random().toString(36), role: 'user', content: text }
    const assistantId = Math.random().toString(36)
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true }

    setMessages(m => [...m, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    sendScale.value = withSpring(0.85, { damping: 10 }, () => {
      sendScale.value = withSpring(1, { damping: 10 })
    })

    fireRequest(assistantId, text, false)
  }

  async function fireRequest(assistantId: string, text: string, isRetry: boolean) {
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

      const lines = chunk.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6)) as SabrinaStreamEvent & { type: string; message?: string }
          if (event.type === 'message_start' && event.conversationId) {
            setConversationId(event.conversationId)
          }
          if (event.type === 'content_delta' && event.delta) {
            fullText += event.delta
            const snap = fullText
            setMessages(m => m.map(msg =>
              msg.id === assistantId ? { ...msg, content: snap } : msg
            ))
          }
          if (event.type === 'message_end') {
            setMessages(m => m.map(msg =>
              msg.id === assistantId ? { ...msg, streaming: false } : msg
            ))
          }
          if (event.type === 'error') {
            setMessages(m => m.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: event.message ?? 'Server error', streaming: false, error: true }
                : msg
            ))
          }
        } catch {
          // partial JSON in this chunk — will complete in next readyState call
        }
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
        // Token expired — refresh once and retry
        await useAuthStore.getState().refresh()
        if (useAuthStore.getState().accessToken) {
          setMessages(m => m.map(msg =>
            msg.id === assistantId ? { ...msg, content: '', streaming: true } : msg
          ))
          fireRequest(assistantId, text, true)
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

    xhr.send(JSON.stringify({ message: text, conversationId }))
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.sabrinaAvatar}>
          <Text style={styles.sabrinaAvatarText}>✦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sabrinaName}>Sabrina</Text>
          <Text style={styles.sabrinaStatus}>
            {loading ? '● Thinking…' : '● Online · Always here'}
          </Text>
        </View>
        {loading && (
          <TouchableOpacity
            onPress={() => { xhrRef.current?.abort(); setLoading(false) }}
            style={styles.stopBtn}
          >
            <Text style={styles.stopText}>Stop</Text>
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
              I can see all your finances and help you make the most of them.
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
            <View style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              item.error && styles.errorBubble,
            ]}>
              {item.error ? (
                <View style={styles.errorInner}>
                  <Text style={styles.errorLabel}>⚠ Couldn't respond</Text>
                  <Text style={styles.errorBody}>{item.content}</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>
                    {item.content || (item.streaming ? '' : '…')}
                    {item.streaming && !item.content && (
                      <Text style={styles.typingDots}> ●●●</Text>
                    )}
                  </Text>
                  {item.streaming && item.content && (
                    <View style={styles.streamingDot} />
                  )}
                </>
              )}
            </View>
          </Animated.View>
        )}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Sabrina anything…"
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
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
  },
  sabrinaAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ff346520', borderWidth: 1, borderColor: '#ff346540',
    alignItems: 'center', justifyContent: 'center',
  },
  sabrinaAvatarText: { color: '#ff3465', fontSize: 18 },
  sabrinaName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  sabrinaStatus: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 },
  stopBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  stopText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  messageList: { padding: 16, gap: 10, flexGrow: 1 },
  messageListEmpty: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 24 },
  emptyAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#ff346515', borderWidth: 2, borderColor: '#ff346530',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyAvatarText: { color: '#ff3465', fontSize: 28 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7a99', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  starters: { width: '100%', gap: 8 },
  starter: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#e2e6f0',
  },
  starterText: { fontSize: 14, color: '#374157', fontWeight: '500' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  assistantAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#ff346515', borderWidth: 1, borderColor: '#ff346330',
    alignItems: 'center', justifyContent: 'center', marginBottom: 2, flexShrink: 0,
  },
  errorAvatar: { backgroundColor: '#ff346560' },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 13 },
  userBubble: { backgroundColor: '#ff3465', borderBottomRightRadius: 4 },
  assistantBubble: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#e2e6f0',
  },
  errorBubble: { backgroundColor: '#fff5f7', borderColor: '#ffb3c1', padding: 0, overflow: 'hidden' },
  errorInner: { padding: 13 },
  errorLabel: { fontSize: 12, fontWeight: '700', color: '#cc2244', marginBottom: 4, letterSpacing: 0.2 },
  errorBody: { fontSize: 14, color: '#7a2233', lineHeight: 20 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  assistantText: { color: '#111827' },
  errorText: { color: '#cc2244' },
  typingDots: { opacity: 0.4 },
  streamingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#ff3465', marginTop: 6, opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f2f8',
  },
  input: {
    flex: 1, backgroundColor: '#f8f9fc', borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 15, color: '#111827', maxHeight: 100,
    borderWidth: 1, borderColor: '#e2e6f0',
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#ff3465', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ff3465', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  sendBtnDisabled: { opacity: 0.35, shadowOpacity: 0 },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
})
