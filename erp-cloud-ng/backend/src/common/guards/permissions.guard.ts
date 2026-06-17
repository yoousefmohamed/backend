import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<RequiredPermission>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('غير مصرح لك بالوصول');

    if (user.roleCode === 'admin') return true;

    const permissions: { module: string; action: string }[] = user.permissions || [];
    const allowed = permissions.some(
      (p) => p.module === required.module && p.action === required.action,
    );

    if (!allowed) {
      throw new ForbiddenException(
        `لا تملك صلاحية (${required.action}) على وحدة (${required.module})`,
      );
    }
    return true;
  }
}
