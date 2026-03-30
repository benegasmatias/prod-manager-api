import { AdminService } from './admin.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    initAdmin(req: any): Promise<import("../users/entities/user.entity").User>;
    private checkGlobalAdmin;
    getPlans(req: any): Promise<import("./entities/subscription-plan.entity").SubscriptionPlan[]>;
    getPlan(req: any, id: string): Promise<import("./entities/subscription-plan.entity").SubscriptionPlan>;
    createPlan(req: any, dto: CreatePlanDto): Promise<import("./entities/subscription-plan.entity").SubscriptionPlan>;
    updatePlan(req: any, id: string, dto: UpdatePlanDto): Promise<import("./entities/subscription-plan.entity").SubscriptionPlan>;
    deletePlan(req: any, id: string): Promise<void>;
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
export declare class PlansPublicController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getActivePlans(): Promise<import("./entities/subscription-plan.entity").SubscriptionPlan[]>;
}
