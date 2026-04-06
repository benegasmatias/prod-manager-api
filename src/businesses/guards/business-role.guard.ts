import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessMembership } from '../entities/business-membership.entity';
import { BusinessRole } from '../../common/enums';
import { ROLES_KEY } from '../decorators/require-business-role.decorator';
import { getBusinessIdFromRequest } from '../utils/business-request.utils';

@Injectable()
export class BusinessRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(BusinessMembership)
    private readonly membershipRepository: Repository<BusinessMembership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<BusinessRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const businessId = getBusinessIdFromRequest(request);
    const userId = request.user?.id;

    if (!businessId || !userId) {
      // If we don't have businessId/userId, we can't resolve role.
      // If roles are required, this should fail anyway.
      if (requiredRoles && requiredRoles.length > 0) {
        throw new ForbiddenException('Negocio o usuario no identificado para validación de roles.');
      }
      return true;
    }

    const membership = await this.membershipRepository.findOne({
      where: { userId, businessId }
    });

    if (!membership) {
       if (requiredRoles && requiredRoles.length > 0) {
         throw new ForbiddenException('No tienes una membresía activa en este negocio.');
       }
       return true;
    }

    // Always inject role for other guards/interceptors (Fase 4.3)
    request.businessRole = membership.role;

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(membership.role);
      if (!hasRole) {
        throw new ForbiddenException(`Nivel insuficiente. Se requiere uno de los roles: ${requiredRoles.join(', ')}. Tu rol actual es: ${membership.role}`);
      }
    }

    return true;
  }
}
