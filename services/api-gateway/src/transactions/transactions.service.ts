import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async getTransactions(userId: string, filters: {
    accountId?: string
    limit?: number
    offset?: number
    search?: string
    from?: string
    to?: string
  }) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(filters.accountId && { accountId: filters.accountId }),
        ...(filters.from && { createdAt: { gte: new Date(filters.from) } }),
        ...(filters.to && { createdAt: { lte: new Date(filters.to) } }),
        ...(filters.search && {
          OR: [
            { description: { contains: filters.search, mode: 'insensitive' } },
            { merchantName: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    })
  }

  async getTransaction(id: string, userId: string) {
    return this.prisma.transaction.findFirst({ where: { id, userId } })
  }

  async addNote(id: string, userId: string, notes: string) {
    return this.prisma.transaction.updateMany({
      where: { id, userId },
      data: { notes },
    })
  }

  async addTags(id: string, userId: string, tags: string[]) {
    return this.prisma.transaction.updateMany({
      where: { id, userId },
      data: { tags },
    })
  }

  async getSpendingInsights(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const from = new Date()
    if (period === 'week') from.setDate(from.getDate() - 7)
    else if (period === 'month') from.setMonth(from.getMonth() - 1)
    else from.setFullYear(from.getFullYear() - 1)

    const txs = await this.prisma.transaction.findMany({
      where: { userId, direction: 'OUTBOUND', status: 'COMPLETED', createdAt: { gte: from } },
    })

    const byCategory: Record<string, number> = {}
    for (const tx of txs) {
      const cat = tx.merchantCategory ?? 'Other'
      byCategory[cat] = (byCategory[cat] ?? 0) + parseFloat(tx.amount.toString())
    }

    const total = Object.values(byCategory).reduce((a, b) => a + b, 0)
    return {
      total,
      period,
      categories: Object.entries(byCategory)
        .map(([name, amount]) => ({ name, amount, percentage: (amount / total) * 100 }))
        .sort((a, b) => b.amount - a.amount),
    }
  }
}
