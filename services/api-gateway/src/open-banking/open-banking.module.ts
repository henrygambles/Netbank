import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OpenBankingController } from './open-banking.controller'
import { OpenBankingService } from './open-banking.service'

@Module({
  imports: [PrismaModule],
  controllers: [OpenBankingController],
  providers: [OpenBankingService],
  exports: [OpenBankingService],
})
export class OpenBankingModule {}
