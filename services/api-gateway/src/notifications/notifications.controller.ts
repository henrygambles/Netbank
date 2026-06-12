import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { NotificationsService } from './notifications.service'

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@Req() req: any) {
    return this.notifications.getNotifications(req.user.id)
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    return this.notifications.markRead(id, req.user.id)
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.id)
  }
}
