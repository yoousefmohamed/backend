import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET') || 'change_this_access_secret_in_production',
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      companyId: payload.companyId,
      branchId: payload.branchId,
      roleCode: payload.roleCode,
      permissions: payload.permissions,
      username: payload.username,
    };
  }
}
