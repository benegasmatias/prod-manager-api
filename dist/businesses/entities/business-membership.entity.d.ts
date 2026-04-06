import { Business } from './business.entity';
import { User } from '../../users/entities/user.entity';
import { BusinessRole } from '../../common/enums';
export declare class BusinessMembership {
    id: string;
    userId: string;
    user: User;
    businessId: string;
    business: Business;
    role: BusinessRole;
    createdAt: Date;
}
