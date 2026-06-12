import { Controller, Post, Get, Body, Param, Req, Res, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { SabrinaService } from './sabrina.service'

@ApiTags('Sabrina')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'sabrina', version: '1' })
export class SabrinaController {
  constructor(private sabrina: SabrinaService) {}

  @Post('chat')
  async chat(
    @Req() req: any,
    @Res() res: Response,
    @Body() body: { message: string; conversationId?: string },
  ) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    try {
      for await (const event of this.sabrina.chat(req.user.id, body.message, body.conversationId)) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(event)}\n\n`)
        }
      }
    } catch (err: any) {
      if (!res.writableEnded) {
        let message: string = err?.message ?? 'Something went wrong'
        // Extract the human-readable message from Anthropic's nested JSON error string
        try {
          const jsonMatch = message.match(/\{.*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            message = parsed?.error?.message ?? parsed?.message ?? message
          }
        } catch {}
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
      }
    } finally {
      if (!res.writableEnded) res.end()
    }
  }

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.sabrina.getConversations(req.user.id)
  }
}
