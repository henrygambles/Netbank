export const SUPPORTED_FIAT_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'SEK', 'NOK', 'DKK', 'HKD', 'SGD', 'INR', 'MXN', 'BRL',
  'ZAR', 'AED', 'PLN', 'CZK', 'HUF', 'RON', 'TRY',
] as const

export type FiatCurrency = typeof SUPPORTED_FIAT_CURRENCIES[number]

export const SUPPORTED_CRYPTO_CURRENCIES = [
  'BTC', 'ETH', 'SOL', 'XMR', 'USDT', 'USDC', 'BNB',
  'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI',
  'ATOM', 'LTC', 'XRP', 'BCH', 'ALGO', 'XLM',
] as const

export type CryptoCurrency = typeof SUPPORTED_CRYPTO_CURRENCIES[number]

export type Currency = FiatCurrency | CryptoCurrency

export interface ExchangeRate {
  from: Currency
  to: Currency
  rate: number
  timestamp: string
}

export interface Money {
  amount: string // string to avoid floating point issues
  currency: FiatCurrency
}
