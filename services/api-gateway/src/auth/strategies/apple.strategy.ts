import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../auth.service'

// Apple Sign-In uses a custom token verification flow.
// The mobile app receives the identity token from ASAuthorizationController,
// then exchanges it with our /auth/apple endpoint below.
@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(config: ConfigService, private auth: AuthService) {
    super({
      jwtFromRequest: (req: any) => req.body?.identityToken,
      secretOrKeyProvider: async (_req: any, _token: string, done: any) => {
        done(null, config.get('APPLE_PUBLIC_KEY', 'not-configured'))
      },
      issuer: 'https://appleid.apple.com',
      audience: config.get('APPLE_CLIENT_ID', 'not-configured'),
    })
  }

  async validate(payload: { sub: string; email: string; given_name?: string; family_name?: string }) {
    return this.auth.loginWithOAuth('apple', payload.sub, {
      email: payload.email,
      firstName: payload.given_name ?? 'Netbank',
      lastName: payload.family_name ?? 'User',
    })
  }
}
