import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { address: true } })
  }

  async updateProfile(userId: string, data: {
    firstName?: string
    lastName?: string
    phone?: string
    avatarUrl?: string
  }) {
    return this.prisma.user.update({ where: { id: userId }, data })
  }

  async updateAddress(userId: string, address: {
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }) {
    return this.prisma.userAddress.upsert({
      where: { userId },
      create: { userId, ...address },
      update: address,
    })
  }
}
