import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AccountType, FiatCurrency } from '@netbank/types'

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getAccounts(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      include: { pots: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async getAccount(id: string, userId: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId }, include: { pots: true } })
    if (!account) throw new NotFoundException('Account not found')
    return account
  }

  async createAccount(userId: string, data: {
    type: AccountType
    name: string
    currency: FiatCurrency
    color?: string
    emoji?: string
  }) {
    const sortCode = '04-00-04'
    const accountNumber = Math.floor(10000000 + Math.random() * 90000000).toString()

    return this.prisma.account.create({
      data: {
        userId,
        type: data.type.toUpperCase() as any,
        name: data.name,
        currency: data.currency,
        color: data.color ?? '#ff3465',
        emoji: data.emoji,
        sortCode,
        accountNumber,
      },
    })
  }

  async createPot(accountId: string, userId: string, data: {
    name: string
    targetAmount?: number
    color: string
    emoji?: string
  }) {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId } })
    if (!account) throw new ForbiddenException()

    return this.prisma.pot.create({
      data: {
        accountId,
        name: data.name,
        targetAmount: data.targetAmount,
        currency: account.currency,
        color: data.color,
        emoji: data.emoji,
      },
    })
  }

  async transferToPot(accountId: string, potId: string, userId: string, amount: number) {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId } })
    if (!account) throw new ForbiddenException()

    return this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount }, availableBalance: { decrement: amount } },
      }),
      this.prisma.pot.update({
        where: { id: potId },
        data: { balance: { increment: amount } },
      }),
    ])
  }
}
