import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UsersService } from './users.service'

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  profile(@Req() req: any) {
    return this.users.getProfile(req.user.id)
  }

  @Patch('me')
  update(@Req() req: any, @Body() body: any) {
    return this.users.updateProfile(req.user.id, body)
  }

  @Patch('me/address')
  updateAddress(@Req() req: any, @Body() body: any) {
    return this.users.updateAddress(req.user.id, body)
  }
}
