import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';
export declare enum NotificationType {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error"
}
export declare enum NotificationTargetType {
    GLOBAL = "global",
    BUSINESS = "business",
    ROLE = "role",
    USER = "user"
}
export declare class Notification {
    id: string;
    businessId: string;
    business: Business;
    userId: string;
    user: User;
    title: string;
    message: string;
    type: NotificationType;
    targetType: NotificationTargetType;
    targetRole: string;
    isRead: boolean;
    readAt: Date;
    actionUrl: string;
    actionLabel: string;
    createdById: string;
    createdAt: Date;
}
