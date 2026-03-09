import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    initAdmin(req: any): Promise<import("../users/entities/user.entity").User>;
    private checkGlobalAdmin;
    getRoleConfigs(req: any): Promise<import("./entities/global-role-config.entity").GlobalRoleConfig[]>;
    updateRoleConfig(req: any, role: string, body: any): Promise<import("./entities/global-role-config.entity").GlobalRoleConfig>;
    sendNotification(req: any, body: any): Promise<import("../notifications/entities/notification.entity").Notification>;
    getAllBusinesses(req: any): Promise<import("../businesses/entities/business.entity").Business[]>;
    getBusiness(req: any, id: string): Promise<import("../businesses/entities/business.entity").Business>;
    updateBusinessStatus(req: any, id: string, body: {
        status: string;
    }): Promise<import("../businesses/entities/business.entity").Business>;
    updateBusinessSubscription(req: any, id: string, body: {
        planId: string;
        expiresAt: string;
    }): Promise<import("../businesses/entities/business.entity").Business>;
    registerPayment(req: any, id: string, body: {
        months: number;
    }): Promise<import("../businesses/entities/business.entity").Business>;
    getAllUsers(req: any): Promise<import("../users/entities/user.entity").User[]>;
    updateUserStatus(req: any, id: string, body: {
        active: boolean;
    }): Promise<import("../users/entities/user.entity").User>;
    updateUserRole(req: any, id: string, body: {
        role: string;
    }): Promise<import("../users/entities/user.entity").User>;
}
