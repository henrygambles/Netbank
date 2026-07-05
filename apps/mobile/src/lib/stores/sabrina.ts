import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
  imageUri?: string  // local URI for user-attached images (not persisted across sessions)
}

interface SabrinaState {
  conversationId: string | undefined
  messages: ChatMessage[]
  setConversationId: (id: string) => void
  setMessages: (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
  loadConversation: (id: string, messages: ChatMessage[]) => void
  reset: () => void
}

export const useSabrinaStore = create<SabrinaState>()(
  persist(
    (set) => ({
      conversationId: undefined,
      messages: [],

      setConversationId: (id) => set({ conversationId: id }),

      setMessages: (msgs) =>
        set((state) => ({
          messages: typeof msgs === 'function' ? msgs(state.messages) : msgs,
        })),

      loadConversation: (id, messages) => set({ conversationId: id, messages }),

      reset: () => set({ conversationId: undefined, messages: [] }),
    }),
    {
      name: 'netbank-sabrina',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        conversationId: state.conversationId,
        // Don't persist imageUri — local URIs are ephemeral
        messages: state.messages.map((m) => ({ ...m, streaming: false, imageUri: undefined })),
      }),
    },
  ),
)
