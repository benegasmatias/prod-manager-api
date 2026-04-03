export class BusinessTemplateDto {
    key: string;
    name: string;
    description: string;
    imageKey: string;
    isAvailable: boolean;
    isComingSoon: boolean;
    requiredPlan: string;
    accessible: boolean;
    accessReason?: string;
}
