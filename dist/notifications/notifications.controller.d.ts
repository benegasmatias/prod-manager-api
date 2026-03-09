import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(req: any, businessId?: string): Promise<Notification[]>;
    getUnreadCount(req: any, businessId?: string): Promise<{
        count: number;
    }>;
    markAsRead(req: any, id: string): Promise<Notification>;
    markAllAsRead(req: any, businessId?: string): Promise<{
        success: boolean;
    }>;
    removeAll(req: any, businessId?: string): Promise<{
        success: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    create(data: Partial<Notification>): Promise<Notification>;
}
