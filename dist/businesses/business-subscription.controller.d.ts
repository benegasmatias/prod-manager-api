import { BillingService } from './billing.service';
import { PlanUsageService } from './plan-usage.service';
export declare class BusinessSubscriptionController {
    private readonly billingService;
    private readonly planUsageService;
    constructor(billingService: BillingService, planUsageService: PlanUsageService);
    getSubscription(id: string): Promise<any>;
    preflight(id: string, plan: string): Promise<any>;
    changePlan(id: string, plan: string, req: any): Promise<import("./entities/business-subscription.entity").BusinessSubscription>;
    sync(id: string): Promise<{
        message: string;
        status: any;
    }>;
}
