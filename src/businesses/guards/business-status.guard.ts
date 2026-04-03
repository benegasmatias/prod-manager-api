import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessStatus } from '../../common/enums';
import { BusinessesService } from '../businesses.service';
import { BUSINESS_STATUSES_KEY } from '../decorators/allow-business-statuses.decorator';
import { getBusinessIdFromRequest } from '../utils/business-request.utils';

@Injectable()
export class BusinessStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly businessesService: BusinessesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredStatuses = this.reflector.getAllAndOverride<BusinessStatus[]>(
      BUSINESS_STATUSES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay decorador, el usuario pidió NO asumir ACTIVE todavía (rollout explícito)
    if (!requiredStatuses) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const businessId = getBusinessIdFromRequest(request);

    if (!businessId) {
      return true; // Si no hay ID, que resuelva el controlador o el Guard de acceso
    }

    // Usar el servicio (directamente el repo interno o findOne)
    // Nota: findOne(userId, businessId) ya hace auth, por eso este Guard va DESPUÉS de BusinessAccessGuard
    const business = await this.businessesService.findOne(request.user.id, businessId);
    if (!business) {
        return true; // No lo encontró o no tiene membresía, que el Guard de acceso se encargue si este falla o resuelva 403 genérico
    }

    const currentStatus = business.status as BusinessStatus;
    
    if (!requiredStatuses.includes(currentStatus)) {
      // Mensaje y código de error consistente para el frontend
      const errorMsg = this.getErrorMessage(currentStatus);
      const errorCode = `BUSINESS_${currentStatus}`;

      throw new ForbiddenException({
        statusCode: 403,
        message: errorMsg,
        errorCode: errorCode, // BUSINESS_DRAFT, BUSINESS_SUSPENDED, etc
        businessId: business.id,
      });
    }

    return true;
  }

  private getErrorMessage(status: BusinessStatus): string {
    switch (status) {
      case BusinessStatus.DRAFT:
        return 'El negocio se encuentra en proceso de creación (Borrador). Debe activarse para operar.';
      case BusinessStatus.SUSPENDED:
        return 'El acceso al negocio ha sido suspendido administrativa o por falta de pago.';
      case BusinessStatus.ARCHIVED:
        return 'El negocio se encuentra en el archivo y no puede procesar operaciones.';
      default:
        return `Estado de negocio (${status}) no permitido para esta operación.`;
    }
  }
}
