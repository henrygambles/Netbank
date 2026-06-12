import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcryptjs'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Email already registered')

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        authProviders: {
          create: { provider: 'email', providerSub: dto.email, passwordHash },
        },
      },
    })

    return this.issueTokens(user.id, user.email)
  }

  async loginWithEmail(email: string, password: string) {
    const provider = await this.prisma.authProvider.findUnique({
      where: { provider_providerSub: { provider: 'email', providerSub: email } },
      include: { user: true },
    })

    if (!provider || !provider.passwordHash) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(password, provider.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    return this.issueTokens(provider.user.id, provider.user.email)
  }

  async loginWithOAuth(provider: string, providerSub: string, profile: {
    email: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }) {
    let authProvider = await this.prisma.authProvider.findUnique({
      where: { provider_providerSub: { provider, providerSub } },
      include: { user: true },
    })

    if (!authProvider) {
      const user = await this.prisma.user.upsert({
        where: { email: profile.email },
        update: {},
        create: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
        },
      })

      authProvider = await this.prisma.authProvider.create({
        data: { userId: user.id, provider, providerSub },
        include: { user: true },
      })
    }

    return this.issueTokens(authProvider.user.id, authProvider.user.email)
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    })

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } })
    return this.issueTokens(user.id, user.email)
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    })
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = this.jwt.sign({ sub: userId, email })

    const refreshToken = this.jwt.sign(
      { sub: userId },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    })

    return { accessToken, refreshToken, expiresIn: 900 }
  }
}
