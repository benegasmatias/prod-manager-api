import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { Business } from './entities/business.entity';
import { PlanUsageService } from './plan-usage.service';
import { PLAN_LIMITS } from './config/plan-limits.config';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { SubscriptionStatus, BusinessStatus, WebhookStatus } from '../common/enums';
import { WebhookEvent } from './entities/webhook-event.entity';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(BusinessSubscription)
        private readonly subscriptionRepository: Repository<BusinessSubscription>,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(WebhookEvent)
        private readonly webhookRepository: Repository<WebhookEvent>,
        private readonly planUsageService: PlanUsageService,
        private readonly auditService: AuditService,
    ) { }

    async createDefaultSubscription(businessId: string, plan: string = 'FREE', manager?: EntityManager): Promise<BusinessSubscription> {
        const repo = manager ? manager.getRepository(BusinessSubscription) : this.subscriptionRepository;
        
        const subscription = repo.create({
            businessId,
            plan,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
        });

        const saved = await repo.save(subscription);

        await this.auditService.log(
            AuditAction.RESOURCE_CREATED, 
            'SUBSCRIPTION', 
            businessId, 
            businessId, 
            null, 
            { plan, status: SubscriptionStatus.ACTIVE }
        );

        return saved;
    }

    async preflightCheck(businessId: string, targetPlan: string): Promise<any> {
        const usage = await this.planUsageService.getBusinessUsage(businessId);
        const targetLimits = PLAN_LIMITS[targetPlan];

        if (!targetLimits) throw new BadRequestException(`Plan ${targetPlan} no reconocido`);

        const violations: string[] = [];
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

    async changePlan(businessId: string, newPlan: string, actorUserId: string): Promise<BusinessSubscription> {
        const preflight = await this.preflightCheck(businessId, newPlan);
        
        if (!preflight.isAllowed) {
            await this.auditService.log(
                AuditAction.QUOTA_EXCEEDED, 
                'BUSINESS', 
                businessId, 
                businessId, 
                actorUserId, 
                { action: 'DOWNGRADE_BLOCKED', targetPlan: newPlan, violations: preflight.violations }
            );
            throw new BadRequestException({
                message: 'No puedes cambiar al plan seleccionado por exceder límites actuales.',
                violations: preflight.violations
            });
        }

        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription) throw new NotFoundException('Suscripción no encontrada');

        const previousPlan = subscription.plan;
        subscription.plan = newPlan;
        
        const saved = await this.subscriptionRepository.save(subscription);

        // Actualización transaccional del fallback legacy opcionalmente
        await this.businessRepository.update(businessId, { plan: newPlan });

        await this.auditService.log(
            AuditAction.BUSINESS_STATUS_CHANGED, // Usaremos uno genérico o crearemos nuevos
            'SUBSCRIPTION', 
            businessId, 
            businessId, 
            actorUserId, 
            { event: 'SUBSCRIPTION_PLAN_CHANGED', previousPlan, newPlan }
        );

        return saved;
    }

    async updateSubscriptionStatus(businessId: string, newStatus: SubscriptionStatus, actorUserId?: string): Promise<BusinessSubscription> {
        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription) throw new NotFoundException('Suscripción no encontrada');

        const previousStatus = subscription.status;
        subscription.status = newStatus;
        
        const saved = await this.subscriptionRepository.save(subscription);

        // Sincronización operativa
        await this.syncBusinessStatusFromSubscription(businessId, newStatus);

        await this.auditService.log(
            AuditAction.BUSINESS_STATUS_CHANGED, 
            'SUBSCRIPTION', 
            businessId, 
            businessId, 
            actorUserId || null, 
            { event: 'SUBSCRIPTION_STATUS_CHANGED', previousStatus, newStatus }
        );

        return saved;
    }

    async syncBusinessStatusFromSubscription(businessId: string, status: SubscriptionStatus): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        if (!business) return;

        let businessStatus = business.status;
        let acceptingOrders = business.acceptingOrders;

        const isGracePeriodOver = business.subscription?.gracePeriodEndAt 
            ? new Date() > business.subscription.gracePeriodEndAt 
            : false;

        // Reglas Centralizadas de Visibilidad y Operación
        if (status === SubscriptionStatus.EXPIRED || (status === SubscriptionStatus.SUSPENDED)) {
            businessStatus = BusinessStatus.SUSPENDED;
            acceptingOrders = false;
        } else if (status === SubscriptionStatus.PAST_DUE) {
            // PAST_DUE permite seguir operando hasta que expire el período de gracia (Fase 5.3)
            if (isGracePeriodOver) {
                businessStatus = BusinessStatus.SUSPENDED;
                acceptingOrders = false;
            } else {
                businessStatus = BusinessStatus.ACTIVE;
                acceptingOrders = true; 
            }
        } else if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING) {
            businessStatus = BusinessStatus.ACTIVE;
            acceptingOrders = true;
        }

        await this.businessRepository.update(businessId, { 
            status: businessStatus, 
            acceptingOrders 
        });
    }

    // --- Webhook Resilience Layer (Fase 5.3) ---

    async recordWebhookEvent(provider: string, eventId: string, type: string, payload: any, businessId?: string): Promise<WebhookEvent> {
        // Verificar si ya existe para evitar duplicados (Idempotencia)
        const existing = await this.webhookRepository.findOneBy({ provider, providerEventId: eventId });
        if (existing) return existing;

        const event = this.webhookRepository.create({
            provider,
            providerEventId: eventId,
            eventType: type,
            payload,
            businessId,
            status: WebhookStatus.RECEIVED
        });

        return this.webhookRepository.save(event);
    }

    async processSubscriptionEvent(webhookId: string): Promise<void> {
        const event = await this.webhookRepository.findOneBy({ id: webhookId });
        if (!event || event.status === WebhookStatus.PROCESSED) return;

        try {
            // Lógica de Despacho según evento
            // Nota: En producción, aquí resolvemos el businessId por el providerCustomerId/SubID si no viene en Metadata
            const businessId = event.businessId;
            if (!businessId) throw new Error('BusinessId no resuelto para el evento');

            const payload = event.payload;

            switch (event.eventType) {
                case 'invoice.paid':
                    await this.updateSubscriptionStatus(businessId, SubscriptionStatus.ACTIVE);
                    // Limpiar fechas de gracia
                    await this.subscriptionRepository.update(businessId, { gracePeriodEndAt: null });
                    break;
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(businessId);
                    break;
                case 'customer.subscription.deleted':
                    await this.updateSubscriptionStatus(businessId, SubscriptionStatus.EXPIRED);
                    break;
                default:
                    event.status = WebhookStatus.IGNORED;
            }

            if (event.status !== WebhookStatus.IGNORED) {
                event.status = WebhookStatus.PROCESSED;
            }
            event.processedAt = new Date();
            await this.webhookRepository.save(event);

        } catch (error) {
            event.status = WebhookStatus.FAILED;
            event.errorMessage = error.message;
            await this.webhookRepository.save(event);
            throw error;
        }
    }

    private async handlePaymentFailed(businessId: string): Promise<void> {
        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription) return;

        // Configurar Período de Gracia (ej: 5 días)
        const gracePeriod = new Date();
        gracePeriod.setDate(gracePeriod.getDate() + 5);

        subscription.status = SubscriptionStatus.PAST_DUE;
        subscription.gracePeriodEndAt = gracePeriod;

        await this.subscriptionRepository.save(subscription);
        await this.syncBusinessStatusFromSubscription(businessId, SubscriptionStatus.PAST_DUE);
    }
}
