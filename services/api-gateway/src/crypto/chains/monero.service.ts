import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface MoneroRPCResponse<T> {
  result: T
  error?: { code: number; message: string }
}

@Injectable()
export class MoneroService {
  private readonly logger = new Logger(MoneroService.name)
  private readonly rpcUrl: string
  private readonly rpcAuth: string

  constructor(private config: ConfigService) {
    this.rpcUrl = config.get('XMR_RPC_URL', 'http://localhost:18082')
    const user = config.get('XMR_RPC_USER', 'netbank')
    const pass = config.get('XMR_RPC_PASS', 'changeme')
    this.rpcAuth = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
  }

  // Monero uses wallet-RPC — each user wallet is a separate wallet file
  async generateKeypair(): Promise<{ address: string; privateKey: string; seed?: string }> {
    const result = await this.rpc<{
      address: string
      info: { seed: string }
    }>('create_wallet', {
      filename: `wallet_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      password: '',
      language: 'English',
    })

    const seedResult = await this.rpc<{ key: string }>('query_key', { key_type: 'mnemonic' })

    return {
      address: result.address,
      privateKey: result.address,
      seed: seedResult.key,
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      await this.openWallet(address)
      const result = await this.rpc<{ balance: number; unlocked_balance: number }>('get_balance', {
        account_index: 0,
      })
      return (result.unlocked_balance / 1e12).toFixed(12)
    } catch (e) {
      this.logger.warn(`Failed to fetch XMR balance for ${address}`)
      return '0'
    }
  }

  async sendTransaction(params: {
    walletSeed: string
    toAddress: string
    amount: string
  }): Promise<string> {
    const atomicAmount = Math.round(parseFloat(params.amount) * 1e12)

    const result = await this.rpc<{ tx_hash: string }>('transfer', {
      destinations: [{ amount: atomicAmount, address: params.toAddress }],
      priority: 2,
      ring_size: 16,
    })

    return result.tx_hash
  }

  async getTransactionHistory(address: string): Promise<any[]> {
    await this.openWallet(address)
    const result = await this.rpc<{ in: any[]; out: any[] }>('get_transfers', {
      in: true,
      out: true,
      account_index: 0,
    })
    return [...(result.in ?? []), ...(result.out ?? [])]
  }

  private async openWallet(walletName: string): Promise<void> {
    await this.rpc('open_wallet', { filename: walletName, password: '' })
  }

  private async rpc<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${this.rpcUrl}/json_rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.rpcAuth,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: '0', method, params }),
    })

    const data = await res.json() as MoneroRPCResponse<T>

    if (data.error) {
      throw new Error(`Monero RPC error ${data.error.code}: ${data.error.message}`)
    }

    return data.result
  }
}
