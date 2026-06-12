import type { FiatCurrency } from './currency'

export type TransactionType =
  | 'payment'
  | 'transfer'
  | 'topup'
  | 'withdrawal'
  | 'refund'
  | 'fee'
  | 'interest'
  | 'crypto_buy'
  | 'crypto_sell'
  | 'crypto_receive'
  | 'crypto_send'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed'
export type TransactionDirection = 'inbound' | 'outbound'

export interface Transaction {
  id: string
  accountId: string
  userId: string
  type: TransactionType
  status: TransactionStatus
  direction: TransactionDirection
  amount: string
  currency: FiatCurrency
  localAmount?: string
  localCurrency?: FiatCurrency
  description: string
  merchantName?: string
  merchantLogo?: string
  merchantCategory?: string
  merchantCategoryCode?: string
  notes?: string
  tags?: string[]
  receiptUrl?: string
  counterpartyName?: string
  counterpartyAccountNumber?: string
  counterpartySortCode?: string
  metadata?: Record<string, unknown>
  createdAt: string
  settledAt?: string
}

export interface TransactionFilters {
  accountId?: string
  type?: TransactionType
  status?: TransactionStatus
  direction?: TransactionDirection
  from?: string
  to?: string
  minAmount?: number
  maxAmount?: number
  search?: string
  tags?: string[]
  page?: number
  limit?: number
}
