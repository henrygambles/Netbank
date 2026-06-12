import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AccountsService } from './accounts.service'

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'accounts', version: '1' })
export class AccountsController {
  constructor(private accounts: AccountsService) {}

  @Get()
  list(@Req() req: any) {
    return this.accounts.getAccounts(req.user.id)
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.accounts.getAccount(id, req.user.id)
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.accounts.createAccount(req.user.id, body)
  }

  @Post(':id/pots')
  createPot(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.accounts.createPot(id, req.user.id, body)
  }

  @Post(':id/pots/:potId/transfer')
  transferToPot(
    @Param('id') id: string,
    @Param('potId') potId: string,
    @Body() body: { amount: number },
    @Req() req: any,
  ) {
    return this.accounts.transferToPot(id, potId, req.user.id, body.amount)
  }
}
