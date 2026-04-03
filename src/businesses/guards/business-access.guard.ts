import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { BusinessesService } from '../../businesses/businesses.service';
import { getBusinessIdFromRequest } from '../utils/business-request.utils';

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  constructor(private readonly businessesService: BusinessesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const businessId = getBusinessIdFromRequest(request);

    if (!businessId) {
      return true;
    }

    const hasAccess = await this.businessesService.checkAccess(request.user.id, businessId);
    
    if (!hasAccess) {
      throw new ForbiddenException('No tienes acceso a los datos de este negocio o el negocio no existe.');
    }

    return true;
  }
}
