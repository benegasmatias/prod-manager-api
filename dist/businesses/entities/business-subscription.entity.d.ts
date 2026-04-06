import { Business } from './business.entity';
import { SubscriptionStatus } from '../../common/enums';
export declare class BusinessSubscription {
    businessId: string;
    business: Business;
    plan: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEndAt: Date;
    gracePeriodEndAt: Date;
    cancelAtPeriodEnd: boolean;
    provider: string;
    providerSubscriptionId: string;
    providerCustomerId: string;
    createdAt: Date;
    updatedAt: Date;
}
