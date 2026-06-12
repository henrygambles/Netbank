import { Module } from '@nestjs/common'
import { CryptoController } from './crypto.controller'
import { CryptoService } from './crypto.service'
import { WalletService } from './wallet.service'
import { BitcoinService } from './chains/bitcoin.service'
import { EthereumService } from './chains/ethereum.service'
import { SolanaService } from './chains/solana.service'
import { MoneroService } from './chains/monero.service'
import { PriceService } from './price.service'

@Module({
  controllers: [CryptoController],
  providers: [
    CryptoService,
    WalletService,
    BitcoinService,
    EthereumService,
    SolanaService,
    MoneroService,
    PriceService,
  ],
  exports: [CryptoService, PriceService],
})
export class CryptoModule {}
