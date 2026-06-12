import { Module } from '@nestjs/common'
import { SabrinaController } from './sabrina.controller'
import { SabrinaService } from './sabrina.service'
import { CryptoModule } from '../crypto/crypto.module'

@Module({
  imports: [CryptoModule],
  controllers: [SabrinaController],
  providers: [SabrinaService],
})
export class SabrinaModule {}
