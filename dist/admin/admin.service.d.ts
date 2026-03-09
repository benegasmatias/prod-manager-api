import { Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { GlobalRoleConfig } from './entities/global-role-config.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';
export declare class AdminService {
    private readonly businessRepository;
    private readonly userRepository;
    private readonly roleConfigRepository;
    private readonly notificationsService;
    constructor(businessRepository: Repository<Business>, userRepository: Repository<User>, roleConfigRepository: Repository<GlobalRoleConfig>, notificationsService: NotificationsService);
    findAllRoleConfigs(): Promise<GlobalRoleConfig[]>;
    updateRoleConfig(role: string, data: Partial<GlobalRoleConfig>): Promise<GlobalRoleConfig>;
    sendNotification(data: Partial<Notification>): Promise<Notification>;
    findAllBusinesses(): Promise<Business[]>;
    findBusinessById(id: string): Promise<Business>;
    updateBusinessStatus(id: string, status: string): Promise<Business>;
    updateBusinessSubscription(id: string, planId: string, expiresAt: Date): Promise<Business>;
    registerPayment(id: string, months: number): Promise<Business>;
    findAllUsers(): Promise<User[]>;
    updateUserStatus(id: string, active: boolean): Promise<User>;
    updateUserGlobalRole(id: string, role: string): Promise<User>;
}
