import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CryptoService } from './crypto.service'
import { PriceService } from './price.service'
import type { CryptoCurrency } from '@netbank/types'

@ApiTags('Crypto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'crypto', version: '1' })
export class CryptoController {
  constructor(
    private crypto: CryptoService,
    private prices: PriceService,
  ) {}

  @Get('wallets')
  getWallets(@Req() req: any) {
    return this.crypto.getUserWallets(req.user.id)
  }

  @Post('wallets')
  createWallet(@Req() req: any, @Body() body: { currency: CryptoCurrency }) {
    return this.crypto.createWallet(req.user.id, body.currency)
  }

  @Get('wallets/:id/balance')
  getBalance(@Param('id') id: string, @Req() req: any) {
    return this.crypto.getWalletBalance(id, req.user.id)
  }

  @Post('wallets/:id/send')
  send(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.crypto.sendCrypto({ walletId: id, userId: req.user.id, ...body })
  }

  @Get('transactions')
  getTransactions(@Req() req: any, @Query('walletId') walletId?: string) {
    return this.crypto.getTransactions(req.user.id, walletId)
  }

  @Get('portfolio')
  getPortfolio(@Req() req: any) {
    return this.crypto.getPortfolioValue(req.user.id)
  }

  @Get('prices')
  getPrices(@Query('currencies') currencies: string) {
    const list = (currencies ?? '').split(',').filter(Boolean) as CryptoCurrency[]
    return this.prices.getPrices(list.length ? list : ['BTC', 'ETH', 'SOL', 'XMR'])
  }

  @Get('prices/:currency')
  getPrice(@Param('currency') currency: string) {
    return this.prices.getPrice(currency.toUpperCase() as CryptoCurrency)
  }
}
