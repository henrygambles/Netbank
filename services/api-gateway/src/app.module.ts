import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { AccountsModule } from './accounts/accounts.module'
import { TransactionsModule } from './transactions/transactions.module'
import { CryptoModule } from './crypto/crypto.module'
import { SabrinaModule } from './sabrina/sabrina.module'
import { NotificationsModule } from './notifications/notifications.module'
import { UsersModule } from './users/users.module'
import { OpenBankingModule } from './open-banking/open-banking.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    CryptoModule,
    SabrinaModule,
    NotificationsModule,
    OpenBankingModule,
  ],
})
export class AppModule {}
