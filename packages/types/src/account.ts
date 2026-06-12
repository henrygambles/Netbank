import type { FiatCurrency } from './currency'

export type AccountType = 'current' | 'savings' | 'joint' | 'business' | 'vault'
export type AccountStatus = 'active' | 'frozen' | 'closed'

export interface Account {
  id: string
  userId: string
  type: AccountType
  status: AccountStatus
  name: string
  currency: FiatCurrency
  balance: string
  availableBalance: string
  sortCode?: string
  accountNumber?: string
  iban?: string
  bic?: string
  color: string
  emoji?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  type: AccountType
  name: string
  currency: FiatCurrency
  color?: string
  emoji?: string
}

export interface Pot {
  id: string
  accountId: string
  name: string
  balance: string
  targetAmount?: string
  currency: FiatCurrency
  color: string
  emoji?: string
  imageUrl?: string
  locked: boolean
  createdAt: string
}
