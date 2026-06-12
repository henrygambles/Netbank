import type { CryptoCurrency, FiatCurrency } from './currency'

export type CryptoNetwork = 'bitcoin' | 'ethereum' | 'solana' | 'monero' | 'binance-smart-chain' | 'polygon'

export interface CryptoWallet {
  id: string
  userId: string
  currency: CryptoCurrency
  network: CryptoNetwork
  address: string
  balance: string
  balanceFiat: string
  fiatCurrency: FiatCurrency
  label?: string
  createdAt: string
}

export interface CryptoTransaction {
  id: string
  walletId: string
  userId: string
  type: 'send' | 'receive' | 'swap' | 'buy' | 'sell'
  status: 'pending' | 'confirming' | 'confirmed' | 'failed'
  amount: string
  currency: CryptoCurrency
  fiatAmount: string
  fiatCurrency: FiatCurrency
  fee: string
  feeCurrency: CryptoCurrency
  txHash?: string
  fromAddress?: string
  toAddress?: string
  confirmations: number
  requiredConfirmations: number
  blockHeight?: number
  network: CryptoNetwork
  notes?: string
  createdAt: string
  confirmedAt?: string
}

export interface CryptoPrice {
  currency: CryptoCurrency
  priceUSD: string
  priceBTC?: string
  change24h: number
  change7d: number
  marketCap: string
  volume24h: string
  circulatingSupply: string
  sparkline: number[]
  updatedAt: string
}

export interface SendCryptoRequest {
  walletId: string
  toAddress: string
  amount: string
  currency: CryptoCurrency
  fee?: 'slow' | 'standard' | 'fast'
  notes?: string
  twoFactorCode: string
}

export interface SwapRequest {
  fromWalletId: string
  toCurrency: CryptoCurrency
  fromAmount: string
  slippage?: number
}
