import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { UserStatus, BusinessStatus } from '../../common/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';

@Injectable()
export class UserStatusGuard implements CanActivate {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const url = request.url;

        // 1. Basic path allowlist
        const allowedPaths = [
            '/users/me',
            '/auth/logout',
            '/auth/refresh',
            '/admin/init',
        ];

        if (allowedPaths.some(path => url.includes(path))) {
            return true;
        }

        // 2. Auth check (Guard depends on AuthGuard)
        if (!user) {
            return true;
        }

        // 3. Global User Status check
        if (user.status === UserStatus.BLOCKED) {
            throw new ForbiddenException('Su cuenta ha sido bloqueada. Contacte a soporte.');
        }

        if (user.status === UserStatus.PENDING && user.globalRole !== 'SUPER_ADMIN') {
            throw new ForbiddenException('PLATFORM_PENDING_APPROVAL');
        }

        // 4. Business Status check (if businessId is present in req)
        const businessId = request.query?.businessId || request.body?.businessId || request.params?.businessId;
        
        if (businessId && businessId !== 'undefined' && businessId.length > 20) {
            const business = await this.businessRepository.findOne({ 
                where: { id: businessId },
                select: ['id', 'status']
            });

            if (business && business.status === BusinessStatus.SUSPENDED) {
                throw new ForbiddenException('BUSINESS_SUSPENDED');
            }
        }

        return true;
    }
}
