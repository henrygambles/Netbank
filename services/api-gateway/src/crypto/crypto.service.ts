import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { WalletService } from './wallet.service'
import { BitcoinService } from './chains/bitcoin.service'
import { EthereumService } from './chains/ethereum.service'
import { SolanaService } from './chains/solana.service'
import { MoneroService } from './chains/monero.service'
import { PriceService } from './price.service'
import type { CryptoCurrency } from '@netbank/types'

@Injectable()
export class CryptoService {
  constructor(
    private prisma: PrismaService,
    private wallets: WalletService,
    private bitcoin: BitcoinService,
    private ethereum: EthereumService,
    private solana: SolanaService,
    private monero: MoneroService,
    private prices: PriceService,
  ) {}

  async getUserWallets(userId: string) {
    return this.prisma.cryptoWallet.findMany({ where: { userId } })
  }

  async createWallet(userId: string, currency: CryptoCurrency) {
    const existing = await this.prisma.cryptoWallet.findUnique({
      where: { userId_currency_network: { userId, currency, network: this.currencyToNetwork(currency) } },
    })
    if (existing) return existing

    return this.wallets.createWallet(userId, currency)
  }

  async getWalletBalance(walletId: string, userId: string) {
    const wallet = await this.prisma.cryptoWallet.findFirst({
      where: { id: walletId, userId },
    })
    if (!wallet) throw new NotFoundException('Wallet not found')

    const balance = await this.fetchBalance(wallet.address, wallet.currency as CryptoCurrency)
    await this.prisma.cryptoWallet.update({
      where: { id: walletId },
      data: { balance: parseFloat(balance) },
    })

    return { ...wallet, balance }
  }

  async sendCrypto(params: {
    walletId: string
    userId: string
    toAddress: string
    amount: string
    currency: CryptoCurrency
  }) {
    const wallet = await this.prisma.cryptoWallet.findFirst({
      where: { id: params.walletId, userId: params.userId },
    })
    if (!wallet) throw new NotFoundException('Wallet not found')

    const privateKey = await this.wallets.getPrivateKey(params.walletId)
    const txHash = await this.broadcastTx(wallet.currency as CryptoCurrency, {
      privateKey,
      toAddress: params.toAddress,
      amount: params.amount,
      fromAddress: wallet.address,
    })

    const tx = await this.prisma.cryptoTransaction.create({
      data: {
        walletId: params.walletId,
        userId: params.userId,
        type: 'SEND',
        status: 'PENDING',
        amount: parseFloat(params.amount),
        currency: params.currency,
        fiatAmount: 0,
        fiatCurrency: 'GBP',
        fee: 0,
        feeCurrency: params.currency,
        txHash,
        toAddress: params.toAddress,
        fromAddress: wallet.address,
        requiredConfirmations: this.getRequiredConfirmations(params.currency),
        network: wallet.network,
      },
    })

    return tx
  }

  async getTransactions(userId: string, walletId?: string) {
    return this.prisma.cryptoTransaction.findMany({
      where: { userId, ...(walletId && { walletId }) },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getPortfolioValue(userId: string): Promise<{
    totalUSD: number
    totalGBP: number
    wallets: Array<{ currency: string; balance: string; valueUSD: number }>
  }> {
    const wallets = await this.prisma.cryptoWallet.findMany({ where: { userId } })
    const currencies = [...new Set(wallets.map(w => w.currency as CryptoCurrency))]

    const priceList = await this.prices.getPrices(currencies)
    const priceMap = new Map(priceList.map(p => [p.currency, parseFloat(p.priceUSD)]))

    let totalUSD = 0
    const enriched = wallets.map(w => {
      const price = priceMap.get(w.currency as CryptoCurrency) ?? 0
      const valueUSD = parseFloat(w.balance.toString()) * price
      totalUSD += valueUSD
      return { currency: w.currency, balance: w.balance.toString(), valueUSD }
    })

    return { totalUSD, totalGBP: totalUSD * 0.79, wallets: enriched }
  }

  private async fetchBalance(address: string, currency: CryptoCurrency): Promise<string> {
    switch (currency) {
      case 'BTC': return this.bitcoin.getBalance(address)
      case 'ETH': return this.ethereum.getBalance(address)
      case 'SOL': return this.solana.getBalance(address)
      case 'XMR': return this.monero.getBalance(address)
      default: return this.ethereum.getBalance(address)
    }
  }

  private async broadcastTx(currency: CryptoCurrency, params: {
    privateKey: string
    toAddress: string
    amount: string
    fromAddress: string
  }): Promise<string> {
    switch (currency) {
      case 'BTC': {
        const hex = await this.bitcoin.buildTransaction({
          fromAddress: params.fromAddress,
          toAddress: params.toAddress,
          amount: parseFloat(params.amount),
          privateKeyWIF: params.privateKey,
        })
        return this.bitcoin.broadcast(hex)
      }
      case 'ETH':
      default:
        return this.ethereum.sendTransaction(params)
      case 'SOL':
        return this.solana.sendTransaction(params)
      case 'XMR':
        return this.monero.sendTransaction({ walletSeed: params.privateKey, ...params })
    }
  }

  private currencyToNetwork(currency: CryptoCurrency): string {
    const map: Partial<Record<CryptoCurrency, string>> = {
      BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XMR: 'monero',
    }
    return map[currency] ?? 'ethereum'
  }

  private getRequiredConfirmations(currency: CryptoCurrency): number {
    const conf: Partial<Record<CryptoCurrency, number>> = {
      BTC: 6, ETH: 12, SOL: 32, XMR: 10,
    }
    return conf[currency] ?? 12
  }
}
