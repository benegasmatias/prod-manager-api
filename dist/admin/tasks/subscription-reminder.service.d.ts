import { Repository } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { NotificationsService } from '../../notifications/notifications.service';
export declare class SubscriptionReminderService {
    private readonly businessRepository;
    private readonly notificationsService;
    private readonly logger;
    constructor(businessRepository: Repository<Business>, notificationsService: NotificationsService);
    checkExpiringSubscriptions(): Promise<void>;
}
