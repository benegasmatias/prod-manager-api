export declare enum AuditAction {
    BUSINESS_ACTIVATED = "BUSINESS_ACTIVATED",
    BUSINESS_STATUS_CHANGED = "BUSINESS_STATUS_CHANGED",
    BUSINESS_ENABLED_CHANGED = "BUSINESS_ENABLED_CHANGED",
    BUSINESS_ARCHIVED = "BUSINESS_ARCHIVED",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
    RESOURCE_CREATED = "RESOURCE_CREATED"
}
export declare class AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    actorUserId: string;
    businessId: string;
    metadata: any;
    createdAt: Date;
}
