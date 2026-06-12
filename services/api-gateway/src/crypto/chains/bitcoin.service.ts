import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bitcoin from 'bitcoinjs-lib'
import * as bip39 from 'bip39'
import { BIP32Factory } from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { ECPairFactory } from 'ecpair'

const bip32 = BIP32Factory(ecc)
const ECPair = ECPairFactory(ecc)

@Injectable()
export class BitcoinService {
  private readonly logger = new Logger(BitcoinService.name)
  private readonly network: bitcoin.Network

  constructor(private config: ConfigService) {
    this.network =
      config.get('BTC_NETWORK') === 'mainnet'
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet
  }

  async generateKeypair() {
    const mnemonic = bip39.generateMnemonic(256)
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const root = bip32.fromSeed(seed, this.network)
    const child = root.derivePath("m/44'/0'/0'/0/0")

    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: this.network,
    })

    return {
      address: address!,
      privateKey: child.toWIF(),
      seed: mnemonic,
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const apiBase =
        this.network === bitcoin.networks.bitcoin
          ? 'https://blockstream.info/api'
          : 'https://blockstream.info/testnet/api'

      const res = await fetch(`${apiBase}/address/${address}`)
      const data = await res.json() as any
      const satoshis =
        data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum
      return (satoshis / 1e8).toFixed(8)
    } catch (e) {
      this.logger.warn(`Failed to fetch BTC balance for ${address}`)
      return '0'
    }
  }

  async buildTransaction(params: {
    fromAddress: string
    toAddress: string
    amount: number
    privateKeyWIF: string
    feeRate?: number
  }): Promise<string> {
    const apiBase =
      this.network === bitcoin.networks.bitcoin
        ? 'https://blockstream.info/api'
        : 'https://blockstream.info/testnet/api'

    const utxosRes = await fetch(`${apiBase}/address/${params.fromAddress}/utxo`)
    const utxos = await utxosRes.json() as any[]

    const keyPair = ECPair.fromWIF(params.privateKeyWIF, this.network)
    const psbt = new bitcoin.Psbt({ network: this.network })

    let inputSum = 0
    for (const utxo of utxos) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network: this.network,
          }).output!,
          value: utxo.value,
        },
      })
      inputSum += utxo.value
    }

    const amountSatoshis = Math.round(params.amount * 1e8)
    const feeSatoshis = (params.feeRate ?? 5) * 250

    psbt.addOutput({ address: params.toAddress, value: amountSatoshis })
    psbt.addOutput({ address: params.fromAddress, value: inputSum - amountSatoshis - feeSatoshis })

    utxos.forEach((_, i) => psbt.signInput(i, keyPair))
    psbt.finalizeAllInputs()

    return psbt.extractTransaction().toHex()
  }

  async broadcast(txHex: string): Promise<string> {
    const apiBase =
      this.network === bitcoin.networks.bitcoin
        ? 'https://blockstream.info/api'
        : 'https://blockstream.info/testnet/api'

    const res = await fetch(`${apiBase}/tx`, {
      method: 'POST',
      body: txHex,
    })
    return res.text()
  }
}
