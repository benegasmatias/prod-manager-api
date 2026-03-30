export declare class SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
    maxUsers: number;
    maxOrdersPerMonth: number;
    maxBusinesses: number;
    maxMachines: number;
    isRecommended: boolean;
    ctaText: string;
    ctaLink: string;
    sortOrder: number;
    active: boolean;
    hasTrial: boolean;
    trialDays: number;
    createdAt: Date;
    updatedAt: Date;
}
