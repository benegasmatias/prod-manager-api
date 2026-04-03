import { SetMetadata } from '@nestjs/common';
import { BusinessStatus } from '../../common/enums';

export const BUSINESS_STATUSES_KEY = 'businessStatuses';

/**
 * Define qué estados del ciclo de vida del negocio son válidos para acceder al endpoint.
 * Ejemplo: @AllowBusinessStatuses(BusinessStatus.ACTIVE, BusinessStatus.DRAFT)
 */
export const AllowBusinessStatuses = (...statuses: BusinessStatus[]) => 
  SetMetadata(BUSINESS_STATUSES_KEY, statuses);
