import { SetMetadata } from '@nestjs/common';
import { BusinessRole } from '../../common/enums';

export const ROLES_KEY = 'business_roles';
export const RequireBusinessRole = (...roles: (keyof typeof BusinessRole | BusinessRole)[]) => 
  SetMetadata(ROLES_KEY, roles);
