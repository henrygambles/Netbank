import { Module } from '@nestjs/common'
import { SabrinaController } from './sabrina.controller'
import { SabrinaService } from './sabrina.service'
import { CryptoModule } from '../crypto/crypto.module'
import { OpenBankingModule } from '../open-banking/open-banking.module'

@Module({
  imports: [CryptoModule, OpenBankingModule],
  controllers: [SabrinaController],
  providers: [SabrinaService],
})
export class SabrinaModule {}
