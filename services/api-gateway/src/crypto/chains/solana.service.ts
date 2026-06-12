import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import bs58 from 'bs58'
import * as bip39 from 'bip39'
import { derivePath } from 'ed25519-hd-key'

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name)
  private readonly connection: Connection

  constructor(private config: ConfigService) {
    this.connection = new Connection(
      config.get('SOL_RPC_URL', 'https://api.mainnet-beta.solana.com'),
      'confirmed',
    )
  }

  async generateKeypair() {
    const mnemonic = bip39.generateMnemonic(256)
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key
    const keypair = Keypair.fromSeed(derivedSeed)

    return {
      address: keypair.publicKey.toBase58(),
      privateKey: bs58.encode(keypair.secretKey),
      seed: mnemonic,
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const pubkey = new PublicKey(address)
      const lamports = await this.connection.getBalance(pubkey)
      return (lamports / LAMPORTS_PER_SOL).toFixed(9)
    } catch (e) {
      this.logger.warn(`Failed to fetch SOL balance for ${address}`)
      return '0'
    }
  }

  async sendTransaction(params: {
    privateKey: string
    toAddress: string
    amount: string
  }): Promise<string> {
    const secretKey = bs58.decode(params.privateKey)
    const fromKeypair = Keypair.fromSecretKey(secretKey)
    const toPubkey = new PublicKey(params.toAddress)

    const lamports = Math.round(parseFloat(params.amount) * LAMPORTS_PER_SOL)

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey,
        lamports,
      }),
    )

    const sig = await sendAndConfirmTransaction(this.connection, tx, [fromKeypair])
    return sig
  }
}
