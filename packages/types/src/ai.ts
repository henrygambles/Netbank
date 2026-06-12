export type SabrinaMessageRole = 'user' | 'assistant' | 'tool'

export interface SabrinaMessage {
  id: string
  conversationId: string
  role: SabrinaMessageRole
  content: string
  toolCalls?: SabrinaToolCall[]
  createdAt: string
}

export interface SabrinaToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: string
}

export interface SabrinaConversation {
  id: string
  userId: string
  title: string
  messages: SabrinaMessage[]
  createdAt: string
  updatedAt: string
}

export interface SabrináChatRequest {
  conversationId?: string
  message: string
  context?: {
    accountId?: string
    screen?: string
  }
}

export type SabrinaStreamEvent =
  | { type: 'message_start'; conversationId: string }
  | { type: 'content_delta'; delta: string }
  | { type: 'tool_use'; toolName: string; toolInput: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; result: string }
  | { type: 'message_end'; messageId: string }
  | { type: 'error'; error: string }
