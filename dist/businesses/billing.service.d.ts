import { Repository, EntityManager } from 'typeorm';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { Business } from './entities/business.entity';
import { PlanUsageService } from './plan-usage.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionStatus } from '../common/enums';
import { WebhookEvent } from './entities/webhook-event.entity';
export declare class BillingService {
    private readonly subscriptionRepository;
    private readonly businessRepository;
    private readonly webhookRepository;
    private readonly planUsageService;
    private readonly auditService;
    constructor(subscriptionRepository: Repository<BusinessSubscription>, businessRepository: Repository<Business>, webhookRepository: Repository<WebhookEvent>, planUsageService: PlanUsageService, auditService: AuditService);
    createDefaultSubscription(businessId: string, plan?: string, manager?: EntityManager): Promise<BusinessSubscription>;
    preflightCheck(businessId: string, targetPlan: string): Promise<any>;
    changePlan(businessId: string, newPlan: string, actorUserId: string): Promise<BusinessSubscription>;
    updateSubscriptionStatus(businessId: string, newStatus: SubscriptionStatus, actorUserId?: string): Promise<BusinessSubscription>;
    syncBusinessStatusFromSubscription(businessId: string, status: SubscriptionStatus): Promise<void>;
    recordWebhookEvent(provider: string, eventId: string, type: string, payload: any, businessId?: string): Promise<WebhookEvent>;
    processSubscriptionEvent(webhookId: string): Promise<void>;
    private handlePaymentFailed;
}
