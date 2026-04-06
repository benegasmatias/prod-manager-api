"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const business_subscription_entity_1 = require("./entities/business-subscription.entity");
const business_entity_1 = require("./entities/business.entity");
const plan_usage_service_1 = require("./plan-usage.service");
const plan_limits_config_1 = require("./config/plan-limits.config");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const enums_1 = require("../common/enums");
const webhook_event_entity_1 = require("./entities/webhook-event.entity");
let BillingService = class BillingService {
    constructor(subscriptionRepository, businessRepository, webhookRepository, planUsageService, auditService) {
        this.subscriptionRepository = subscriptionRepository;
        this.businessRepository = businessRepository;
        this.webhookRepository = webhookRepository;
        this.planUsageService = planUsageService;
        this.auditService = auditService;
    }
    async createDefaultSubscription(businessId, plan = 'FREE', manager) {
        const repo = manager ? manager.getRepository(business_subscription_entity_1.BusinessSubscription) : this.subscriptionRepository;
        const subscription = repo.create({
            businessId,
            plan,
            status: enums_1.SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
        });
        const saved = await repo.save(subscription);
        await this.auditService.log(audit_log_entity_1.AuditAction.RESOURCE_CREATED, 'SUBSCRIPTION', businessId, businessId, null, { plan, status: enums_1.SubscriptionStatus.ACTIVE });
        return saved;
    }
    async preflightCheck(businessId, targetPlan) {
        const usage = await this.planUsageService.getBusinessUsage(businessId);
        const targetLimits = plan_limits_config_1.PLAN_LIMITS[targetPlan];
        if (!targetLimits)
            throw new common_1.BadRequestException(`Plan ${targetPlan} no reconocido`);
        const violations = [];
        const isAllowed = true;
        if (usage.usage.MACHINES > targetLimits.maxMachinesPerBusiness) {
            violations.push(`Exceso de máquinas: ${usage.usage.MACHINES}/${targetLimits.maxMachinesPerBusiness}`);
        }
        if (usage.usage.EMPLOYEES > targetLimits.maxEmployeesPerBusiness) {
            violations.push(`Exceso de empleados: ${usage.usage.EMPLOYEES}/${targetLimits.maxEmployeesPerBusiness}`);
        }
        return {
            isAllowed: violations.length === 0,
            violations,
            currentUsage: usage.usage,
            targetLimits,
            plan: targetPlan
        };
    }
    async changePlan(businessId, newPlan, actorUserId) {
        const preflight = await this.preflightCheck(businessId, newPlan);
        if (!preflight.isAllowed) {
            await this.auditService.log(audit_log_entity_1.AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, actorUserId, { action: 'DOWNGRADE_BLOCKED', targetPlan: newPlan, violations: preflight.violations });
            throw new common_1.BadRequestException({
                message: 'No puedes cambiar al plan seleccionado por exceder límites actuales.',
                violations: preflight.violations
            });
        }
        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription)
            throw new common_1.NotFoundException('Suscripción no encontrada');
        const previousPlan = subscription.plan;
        subscription.plan = newPlan;
        const saved = await this.subscriptionRepository.save(subscription);
        await this.businessRepository.update(businessId, { plan: newPlan });
        await this.auditService.log(audit_log_entity_1.AuditAction.BUSINESS_STATUS_CHANGED, 'SUBSCRIPTION', businessId, businessId, actorUserId, { event: 'SUBSCRIPTION_PLAN_CHANGED', previousPlan, newPlan });
        return saved;
    }
    async updateSubscriptionStatus(businessId, newStatus, actorUserId) {
        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription)
            throw new common_1.NotFoundException('Suscripción no encontrada');
        const previousStatus = subscription.status;
        subscription.status = newStatus;
        const saved = await this.subscriptionRepository.save(subscription);
        await this.syncBusinessStatusFromSubscription(businessId, newStatus);
        await this.auditService.log(audit_log_entity_1.AuditAction.BUSINESS_STATUS_CHANGED, 'SUBSCRIPTION', businessId, businessId, actorUserId || null, { event: 'SUBSCRIPTION_STATUS_CHANGED', previousStatus, newStatus });
        return saved;
    }
    async syncBusinessStatusFromSubscription(businessId, status) {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        if (!business)
            return;
        let businessStatus = business.status;
        let acceptingOrders = business.acceptingOrders;
        const isGracePeriodOver = business.subscription?.gracePeriodEndAt
            ? new Date() > business.subscription.gracePeriodEndAt
            : false;
        if (status === enums_1.SubscriptionStatus.EXPIRED || (status === enums_1.SubscriptionStatus.SUSPENDED)) {
            businessStatus = enums_1.BusinessStatus.SUSPENDED;
            acceptingOrders = false;
        }
        else if (status === enums_1.SubscriptionStatus.PAST_DUE) {
            if (isGracePeriodOver) {
                businessStatus = enums_1.BusinessStatus.SUSPENDED;
                acceptingOrders = false;
            }
            else {
                businessStatus = enums_1.BusinessStatus.ACTIVE;
                acceptingOrders = true;
            }
        }
        else if (status === enums_1.SubscriptionStatus.ACTIVE || status === enums_1.SubscriptionStatus.TRIALING) {
            businessStatus = enums_1.BusinessStatus.ACTIVE;
            acceptingOrders = true;
        }
        await this.businessRepository.update(businessId, {
            status: businessStatus,
            acceptingOrders
        });
    }
    async recordWebhookEvent(provider, eventId, type, payload, businessId) {
        const existing = await this.webhookRepository.findOneBy({ provider, providerEventId: eventId });
        if (existing)
            return existing;
        const event = this.webhookRepository.create({
            provider,
            providerEventId: eventId,
            eventType: type,
            payload,
            businessId,
            status: enums_1.WebhookStatus.RECEIVED
        });
        return this.webhookRepository.save(event);
    }
    async processSubscriptionEvent(webhookId) {
        const event = await this.webhookRepository.findOneBy({ id: webhookId });
        if (!event || event.status === enums_1.WebhookStatus.PROCESSED)
            return;
        try {
            const businessId = event.businessId;
            if (!businessId)
                throw new Error('BusinessId no resuelto para el evento');
            const payload = event.payload;
            switch (event.eventType) {
                case 'invoice.paid':
                    await this.updateSubscriptionStatus(businessId, enums_1.SubscriptionStatus.ACTIVE);
                    await this.subscriptionRepository.update(businessId, { gracePeriodEndAt: null });
                    break;
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(businessId);
                    break;
                case 'customer.subscription.deleted':
                    await this.updateSubscriptionStatus(businessId, enums_1.SubscriptionStatus.EXPIRED);
                    break;
                default:
                    event.status = enums_1.WebhookStatus.IGNORED;
            }
            if (event.status !== enums_1.WebhookStatus.IGNORED) {
                event.status = enums_1.WebhookStatus.PROCESSED;
            }
            event.processedAt = new Date();
            await this.webhookRepository.save(event);
        }
        catch (error) {
            event.status = enums_1.WebhookStatus.FAILED;
            event.errorMessage = error.message;
            await this.webhookRepository.save(event);
            throw error;
        }
    }
    async handlePaymentFailed(businessId) {
        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription)
            return;
        const gracePeriod = new Date();
        gracePeriod.setDate(gracePeriod.getDate() + 5);
        subscription.status = enums_1.SubscriptionStatus.PAST_DUE;
        subscription.gracePeriodEndAt = gracePeriod;
        await this.subscriptionRepository.save(subscription);
        await this.syncBusinessStatusFromSubscription(businessId, enums_1.SubscriptionStatus.PAST_DUE);
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(business_subscription_entity_1.BusinessSubscription)),
    __param(1, (0, typeorm_1.InjectRepository)(business_entity_1.Business)),
    __param(2, (0, typeorm_1.InjectRepository)(webhook_event_entity_1.WebhookEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        plan_usage_service_1.PlanUsageService,
        audit_service_1.AuditService])
], BillingService);
//# sourceMappingURL=billing.service.js.map