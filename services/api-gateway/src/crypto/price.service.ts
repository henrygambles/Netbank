import { Injectable, Logger } from '@nestjs/common'
import type { CryptoCurrency, CryptoPrice } from '@netbank/types'

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name)
  private cache = new Map<string, { data: CryptoPrice; expires: number }>()

  async getPrice(currency: CryptoCurrency): Promise<CryptoPrice> {
    const cached = this.cache.get(currency)
    if (cached && cached.expires > Date.now()) return cached.data

    const id = this.coingeckoId(currency)
    const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`

    try {
      const res = await fetch(url)
      const data = await res.json() as any
      const price: CryptoPrice = {
        currency,
        priceUSD: data.market_data.current_price.usd.toString(),
        priceBTC: data.market_data.current_price.btc?.toString(),
        change24h: data.market_data.price_change_percentage_24h ?? 0,
        change7d: data.market_data.price_change_percentage_7d ?? 0,
        marketCap: data.market_data.market_cap.usd?.toString() ?? '0',
        volume24h: data.market_data.total_volume.usd?.toString() ?? '0',
        circulatingSupply: data.market_data.circulating_supply?.toString() ?? '0',
        sparkline: data.market_data.sparkline_7d?.price ?? [],
        updatedAt: new Date().toISOString(),
      }

      this.cache.set(currency, { data: price, expires: Date.now() + 60_000 })
      return price
    } catch (e) {
      this.logger.warn(`Failed to fetch price for ${currency}`)
      throw e
    }
  }

  async getPrices(currencies: CryptoCurrency[]): Promise<CryptoPrice[]> {
    return Promise.all(currencies.map(c => this.getPrice(c)))
  }

  private coingeckoId(currency: CryptoCurrency): string {
    const ids: Partial<Record<CryptoCurrency, string>> = {
      BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XMR: 'monero',
      USDT: 'tether', USDC: 'usd-coin', BNB: 'binancecoin',
      ADA: 'cardano', DOGE: 'dogecoin', DOT: 'polkadot',
      AVAX: 'avalanche-2', MATIC: 'matic-network', LINK: 'chainlink',
      UNI: 'uniswap', ATOM: 'cosmos', LTC: 'litecoin',
      XRP: 'ripple', BCH: 'bitcoin-cash', ALGO: 'algorand', XLM: 'stellar',
    }
    return ids[currency] ?? currency.toLowerCase()
  }
}
