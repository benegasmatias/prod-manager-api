import { BusinessMembership } from './business-membership.entity';
import { BusinessSubscription } from './business-subscription.entity';
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
    isEnabled: boolean;
    statusReasonCode: string;
    statusReasonText: string;
    statusUpdatedAt: Date;
    plan: string;
    acceptingOrders: boolean;
    onboardingCompleted: boolean;
    onboardingStep: string;
    capabilitiesOverride: any;
    adminNotes: string;
    memberships: BusinessMembership[];
    subscription: BusinessSubscription;
    createdAt: Date;
    updatedAt: Date;
}
