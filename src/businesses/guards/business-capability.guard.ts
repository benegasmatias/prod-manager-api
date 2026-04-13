import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessesService } from '../businesses.service';
import { REQUIRE_CAPABILITY_KEY } from '../decorators/require-capability.decorator';
import { getBusinessIdFromRequest } from '../utils/business-request.utils';

@Injectable()
export class BusinessCapabilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly businessesService: BusinessesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCapability = this.reflector.getAllAndOverride<string>(
      REQUIRE_CAPABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredCapability) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const businessId = getBusinessIdFromRequest(request);

    if (!businessId) {
       // Si no hay ID de negocio en el request, no podemos validar capacidades específicas
       // pero permitimos pasar si el controlador no lo requiere estrictamente o fallará en otro guard.
      return true; 
    }

    const business = await this.businessesService.findOne(request.user.id, businessId);
    
    if (!business) {
        throw new ForbiddenException('No se encontró el perfil del negocio para validar capacidades.');
    }

    const capabilities = business.capabilities || [];

    if (!capabilities.includes(requiredCapability)) {
      throw new ForbiddenException({
        statusCode: 403,
        message: `Este negocio no tiene habilitada la capacidad requerida: ${requiredCapability}`,
        errorCode: 'CAPABILITY_NOT_ENABLED',
        requiredCapability,
        businessId: business.id,
      });
    }

    return true;
  }
}
