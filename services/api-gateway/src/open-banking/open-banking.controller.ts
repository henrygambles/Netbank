import { Controller, Get, Logger, Post, Body, Query, UseGuards, Req, Res } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OpenBankingService } from './open-banking.service'

@ApiTags('Open Banking')
@Controller({ path: 'open-banking', version: '1' })
export class OpenBankingController {
  private readonly logger = new Logger(OpenBankingController.name)

  constructor(private ob: OpenBankingService) {}

  // Public — no auth. Plaid redirects here after the Link flow completes.
  // We immediately redirect to the app's custom scheme so ASWebAuthenticationSession
  // intercepts it and returns control to the mobile app.
  @Get('oauth-callback')
  oauthCallback(@Query() params: Record<string, string>, @Res() res: Response) {
    this.logger.log(`Plaid oauth-callback: ${JSON.stringify(params)}`)

    if (params.public_token) {
      const qs = new URLSearchParams({
        publicToken: params.public_token,
        institutionId: params.institution_id ?? '',
        institutionName: params.institution_name ?? 'Bank',
      })
      return res.redirect(`netbank://ob-callback?${qs.toString()}`)
    }

    if (params.oauth_state_id) {
      // OAuth first phase — pass state back so the app can re-initialise Link
      return res.redirect(`netbank://ob-callback?oauthStateId=${encodeURIComponent(params.oauth_state_id)}`)
    }

    return res.redirect('netbank://ob-callback?cancelled=true')
  }

  // Public — served in ASWebAuthenticationSession for Phase 2 OAuth completion.
  @Get('link-page')
  getLinkPage(
    @Query('token') token: string,
    @Query('receivedRedirectUri') receivedRedirectUri: string | undefined,
    @Res() res: Response,
  ) {
    if (!token) return res.status(400).send('Missing token')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(this.ob.buildLinkPage(token, receivedRedirectUri))
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('link-token')
  createLinkToken(@Req() req: any, @Query('redirectUri') redirectUri?: string) {
    return this.ob.createLinkToken(req.user.id, redirectUri)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('exchange')
  exchange(
    @Req() req: any,
    @Body() body: { publicToken: string; institutionId: string; institutionName: string },
  ) {
    return this.ob.exchangePublicToken(
      req.user.id,
      body.publicToken,
      body.institutionId,
      body.institutionName,
    )
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('connections')
  getConnections(@Req() req: any) {
    return this.ob.getConnections(req.user.id)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  getTransactions(@Req() req: any, @Query('limit') limit?: string) {
    return this.ob.getTransactions(req.user.id, limit ? parseInt(limit, 10) : 100)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sync')
  sync(@Req() req: any) {
    return this.ob.syncAll(req.user.id)
  }
}
