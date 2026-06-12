import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { BitcoinService } from './chains/bitcoin.service'
import { EthereumService } from './chains/ethereum.service'
import { SolanaService } from './chains/solana.service'
import { MoneroService } from './chains/monero.service'
import { PrismaService } from '../prisma/prisma.service'
import type { CryptoCurrency } from '@netbank/types'

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name)
  private readonly encryptionKey: Buffer

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private bitcoin: BitcoinService,
    private ethereum: EthereumService,
    private solana: SolanaService,
    private monero: MoneroService,
  ) {
    // Derive 32-byte key from the encryption secret
    this.encryptionKey = scryptSync(
      this.config.getOrThrow('ENCRYPTION_KEY'),
      'netbank-wallet-salt',
      32,
    )
  }

  async createWallet(userId: string, currency: CryptoCurrency) {
    const network = this.currencyToNetwork(currency)
    const { address, privateKey, seed } = await this.generateKeypair(currency)

    const encryptedKey = this.encrypt(privateKey)
    const encryptedSeed = seed ? this.encrypt(seed) : undefined

    const wallet = await this.prisma.cryptoWallet.create({
      data: {
        userId,
        currency,
        network,
        address,
        encryptedKey,
        encryptedSeed,
        derivationPath: this.getDerivationPath(currency),
      },
    })

    this.logger.log(`Created ${currency} wallet for user ${userId}`)
    return wallet
  }

  async getPrivateKey(walletId: string): Promise<string> {
    const wallet = await this.prisma.cryptoWallet.findUniqueOrThrow({
      where: { id: walletId },
    })
    return this.decrypt(wallet.encryptedKey)
  }

  private async generateKeypair(currency: CryptoCurrency) {
    switch (currency) {
      case 'BTC':
        return this.bitcoin.generateKeypair()
      case 'ETH':
      case 'USDT':
      case 'USDC':
      case 'BNB':
      case 'MATIC':
      case 'LINK':
      case 'UNI':
        return this.ethereum.generateKeypair()
      case 'SOL':
      case 'ALGO':
        return this.solana.generateKeypair()
      case 'XMR':
        return this.monero.generateKeypair()
      default:
        return this.ethereum.generateKeypair()
    }
  }

  private getDerivationPath(currency: CryptoCurrency): string {
    const coinTypes: Partial<Record<CryptoCurrency, number>> = {
      BTC: 0, ETH: 60, SOL: 501, LTC: 2, BCH: 145,
    }
    const coinType = coinTypes[currency] ?? 60
    return `m/44'/${coinType}'/0'/0/0`
  }

  private currencyToNetwork(currency: CryptoCurrency): string {
    const map: Partial<Record<CryptoCurrency, string>> = {
      BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XMR: 'monero',
      USDT: 'ethereum', USDC: 'ethereum', BNB: 'binance-smart-chain',
      MATIC: 'polygon', LINK: 'ethereum', UNI: 'ethereum',
    }
    return map[currency] ?? 'ethereum'
  }

  private encrypt(text: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
  }

  private decrypt(encrypted: string): string {
    const [ivHex, tagHex, dataHex] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const data = Buffer.from(dataHex, 'hex')
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  }
}
