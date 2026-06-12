import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../auth.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService, private auth: AuthService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: `${config.get('API_URL', 'http://localhost:3000')}/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    })
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const tokens = await this.auth.loginWithOAuth('google', profile.id, {
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      avatarUrl: profile.photos?.[0]?.value,
    })
    done(null, tokens)
  }
}
