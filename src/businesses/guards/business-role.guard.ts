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

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const businessId = getBusinessIdFromRequest(request);
    const userId = request.user?.id;

    if (!businessId || !userId) {
      throw new ForbiddenException('Negocio o usuario no identificado para validación de roles.');
    }

    const membership = await this.membershipRepository.findOne({
      where: { userId, businessId }
    });

    if (!membership) {
      throw new ForbiddenException('No tienes una membresía activa en este negocio.');
    }

    const hasRole = requiredRoles.includes(membership.role);
    if (!hasRole) {
      throw new ForbiddenException(`Nivel insuficiente. Se requiere uno de los roles: ${requiredRoles.join(', ')}. Tu rol actual es: ${membership.role}`);
    }

    // Opcional: Inyectar el rol en el request para que los servicios/controllers lo usen
    request.businessRole = membership.role;

    return true;
  }
}
