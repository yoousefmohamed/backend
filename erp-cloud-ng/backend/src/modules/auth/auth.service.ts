import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.companyId, dto.username);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const valid = await this.usersService.validatePassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    await this.usersService.updateLastLogin(user.id);

    const permissions = (user.role?.permissions || []).map((p) => ({
      module: p.module,
      action: p.action,
    }));

    const payload = {
      sub: user.id,
      companyId: user.companyId,
      branchId: user.branchId,
      roleCode: user.role?.code,
      permissions,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role?.name,
        roleCode: user.role?.code,
        branch: user.branch?.name,
        company: user.company?.name,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(decoded.sub);

      const permissions = (user.role?.permissions || []).map((p) => ({
        module: p.module,
        action: p.action,
      }));

      const payload = {
        sub: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        roleCode: user.role?.code,
        permissions,
        username: user.username,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') || '15m',
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('جلسة غير صالحة، يرجى تسجيل الدخول مجددًا');
    }
  }
}
