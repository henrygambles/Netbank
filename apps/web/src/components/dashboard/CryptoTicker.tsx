'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api/client'

const CURRENCIES = ['BTC', 'ETH', 'SOL', 'XMR', 'USDT', 'BNB', 'ADA', 'MATIC']

const SEED_PRICES = [
  { currency: 'BTC',  priceUSD: '67842.50', change24h:  2.34 },
  { currency: 'ETH',  priceUSD: '3521.18',  change24h:  1.87 },
  { currency: 'SOL',  priceUSD: '178.43',   change24h:  4.12 },
  { currency: 'XMR',  priceUSD: '162.77',   change24h: -0.95 },
  { currency: 'USDT', priceUSD: '1.00',     change24h:  0.01 },
  { currency: 'BNB',  priceUSD: '602.34',   change24h:  1.23 },
  { currency: 'ADA',  priceUSD: '0.4821',   change24h: -1.44 },
  { currency: 'MATIC',priceUSD: '0.7163',   change24h:  3.07 },
]

const LOGO_SLUGS: Record<string, string> = {
  BTC: 'bitcoin-btc', ETH: 'ethereum-eth', SOL: 'solana-sol',
  XMR: 'monero-xmr', USDT: 'tether-usdt', BNB: 'binance-coin-bnb',
  ADA: 'cardano-ada', MATIC: 'polygon-matic-matic',
}

export function CryptoTicker() {
  const { data: prices = SEED_PRICES } = useQuery({
    queryKey: ['crypto-prices'],
    queryFn: () => api.get('/v1/crypto/prices?currencies=' + CURRENCIES.join(',')).then(r => r.data),
    refetchInterval: 30_000,
    placeholderData: SEED_PRICES,
    staleTime: 20_000,
  })

  // Duplicate for seamless loop
  const items = [...prices, ...prices]

  return (
    <div className="card py-3 overflow-hidden">
      <div
        className="flex gap-8 w-max"
        style={{ animation: 'ticker 40s linear infinite' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
      >
        {items.map((p, idx) => {
          const price = parseFloat(p.priceUSD)
          const up = p.change24h >= 0
          return (
            <div key={`${p.currency}-${idx}`} className="flex items-center gap-2 flex-shrink-0">
              <img
                src={`https://cryptologos.cc/logos/${LOGO_SLUGS[p.currency] ?? p.currency.toLowerCase()}.svg`}
                alt={p.currency}
                width={20}
                height={20}
                className="rounded-full"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{p.currency}</span>
              <span className="text-gray-500 text-sm tabular-nums">
                ${price >= 1000
                  ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                  : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 4 : 2 })}
              </span>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-coral-500'}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(p.change24h).toFixed(2)}%
              </span>
              <span className="text-gray-200 dark:text-white/10 select-none">·</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
