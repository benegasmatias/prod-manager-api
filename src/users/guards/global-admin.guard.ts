import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../common/enums';

@Injectable()
export class GlobalAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const url = request.url;

        // Allow initial setup path
        if (url.includes('/admin/init')) {
            return true;
        }

        const user = request.user;
        if (!user || user.globalRole !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('No tienes permisos de administrador de plataforma.');
        }

        return true;
    }
}
