import { BusinessRole } from '../../common/enums';
export declare const ROLES_KEY = "business_roles";
export declare const RequireBusinessRole: (...roles: (keyof typeof BusinessRole | BusinessRole)[]) => import("@nestjs/common").CustomDecorator<string>;
