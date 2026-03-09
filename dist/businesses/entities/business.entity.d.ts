import { BusinessMembership } from './business-membership.entity';
export declare class Business {
    id: string;
    name: string;
    taxId: string;
    address: string;
    phone: string;
    category: string;
    currency: string;
    status: string;
    planId: string;
    trialExpiresAt: Date;
    subscriptionExpiresAt: Date;
    memberships: BusinessMembership[];
    createdAt: Date;
    updatedAt: Date;
}
