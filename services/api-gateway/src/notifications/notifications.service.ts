import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } })
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId }, data: { read: true } })
  }

  async create(userId: string, data: { type: string; title: string; body: string; data?: any }) {
    return this.prisma.notification.create({ data: { userId, ...data } })
  }
}
