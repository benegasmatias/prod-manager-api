import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessMembership } from '../entities/business-membership.entity';

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(BusinessMembership)
    private readonly membershipRepository: Repository<BusinessMembership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Busca el ID en params (/businesses/:id), query (?businessId=...) o body ({ businessId: ... })
    const businessId = 
      request.params.id || 
      request.params.businessId || 
      request.query.businessId || 
      request.body.businessId;

    if (!user || !user.id) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!businessId) {
      // Si el endpoint no especifica businessId en los params, el guard no bloquea, 
      // asumiendo que el controlador o service filtrará por usuario.
      return true;
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        userId: user.id,
        businessId: businessId
      }
    });

    if (!membership) {
      throw new ForbiddenException('No tienes acceso a este negocio o el negocio no existe');
    }

    return true;
  }
}
