import { Controller, Get, Param, Query, Patch, Body, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TransactionsService } from './transactions.service'

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'transactions', version: '1' })
export class TransactionsController {
  constructor(private txs: TransactionsService) {}

  @Get()
  list(@Req() req: any, @Query() query: any) {
    return this.txs.getTransactions(req.user.id, query)
  }

  @Get('insights')
  insights(@Req() req: any, @Query('period') period: any) {
    return this.txs.getSpendingInsights(req.user.id, period)
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.txs.getTransaction(id, req.user.id)
  }

  @Patch(':id/notes')
  addNote(@Param('id') id: string, @Body() body: { notes: string }, @Req() req: any) {
    return this.txs.addNote(id, req.user.id, body.notes)
  }

  @Patch(':id/tags')
  addTags(@Param('id') id: string, @Body() body: { tags: string[] }, @Req() req: any) {
    return this.txs.addTags(id, req.user.id, body.tags)
  }
}
