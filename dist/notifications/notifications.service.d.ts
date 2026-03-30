import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
export declare class NotificationsService {
    private readonly notificationRepository;
    constructor(notificationRepository: Repository<Notification>);
    findAllForUser(user: User, businessId?: string): Promise<Notification[]>;
    getUnreadCount(user: User, businessId?: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<Notification>;
    markAllAsRead(user: User, businessId?: string): Promise<void>;
    create(data: Partial<Notification>): Promise<Notification>;
    remove(id: string): Promise<void>;
    removeAllForUser(user: User, businessId?: string): Promise<void>;
}
