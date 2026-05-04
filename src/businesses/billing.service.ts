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
import { SubscriptionPlan } from '../admin/entities/subscription-plan.entity';
import { MercadoPagoService } from './mercado-pago.service';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(BusinessSubscription)
        private readonly subscriptionRepository: Repository<BusinessSubscription>,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(WebhookEvent)
        private readonly webhookRepository: Repository<WebhookEvent>,
        @InjectRepository(SubscriptionPlan)
        private readonly planRepository: Repository<SubscriptionPlan>,
        private readonly planUsageService: PlanUsageService,
        private readonly auditService: AuditService,
        private readonly mpService: MercadoPagoService,
    ) { }

    async createDefaultSubscription(businessId: string, manager?: EntityManager): Promise<BusinessSubscription> {
        const businessRepo = manager ? manager.getRepository(Business) : this.businessRepository;
        const business = await businessRepo.findOneBy({ id: businessId });
        if (!business) throw new NotFoundException('Business not found');

        const planRepo = manager ? manager.getRepository(SubscriptionPlan) : this.planRepository;
        
        // Buscar el plan gratuito para esta categoría específica
        let freePlan = await planRepo.findOne({ 
            where: { 
                category: business.category, 
                price: 0,
                active: true 
            },
            order: { sortOrder: 'ASC' }
        });

        // Fallback al plan gratuito global si no hay uno específico
        if (!freePlan) {
            freePlan = await planRepo.findOne({ 
                where: { 
                    category: null, 
                    price: 0,
                    active: true 
                },
                order: { sortOrder: 'ASC' }
            });
        }

        const planId = freePlan?.id || 'FREE';
        const hasTrial = freePlan?.hasTrial || false;
        const trialDays = freePlan?.trialDays || 0;
        
        let trialEndAt: Date | null = null;
        if (hasTrial) {
            trialEndAt = new Date();
            trialEndAt.setDate(trialEndAt.getDate() + trialDays);
        }

        const repo = manager ? manager.getRepository(BusinessSubscription) : this.subscriptionRepository;
        const subscription = repo.create({
            businessId,
            plan: planId,
            status: hasTrial ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            trialEndAt: trialEndAt,
        });

        const saved = await repo.save(subscription);

        // Actualizar datos en la entidad Business
        await businessRepo.update(businessId, { 
            subscriptionExpiresAt: trialEndAt, // null si es de por vida
            plan: planId 
        });

        await this.auditService.log(
            AuditAction.RESOURCE_CREATED, 
            'SUBSCRIPTION', 
            businessId, 
            businessId, 
            null, 
            { plan: planId, status: hasTrial ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE, trialEndAt }
        );

        return saved;
    }

    async preflightCheck(businessId: string, targetPlan: string): Promise<any> {
        const usage = await this.planUsageService.getBusinessUsage(businessId);
        const targetLimits = await this.planUsageService.getLimitsForPlan(targetPlan);

        if (!targetLimits) throw new BadRequestException(`Plan ${targetPlan} no reconocido`);

        const violations: string[] = [];

        if (targetLimits.maxMachinesPerBusiness !== 0 && usage.usage.MACHINES > targetLimits.maxMachinesPerBusiness) {
            violations.push(`Exceso de máquinas: ${usage.usage.MACHINES}/${targetLimits.maxMachinesPerBusiness}`);
        }

        if (targetLimits.maxEmployeesPerBusiness !== 0 && usage.usage.EMPLOYEES > targetLimits.maxEmployeesPerBusiness) {
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
        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription) throw new NotFoundException('Suscripción no encontrada');

        const preflight = await this.preflightCheck(businessId, newPlan);
        const isDowngrade = this.isDowngrade(subscription.plan, newPlan);

        if (!preflight.isAllowed && !isDowngrade) {
            await this.auditService.log(
                AuditAction.QUOTA_EXCEEDED, 
                'BUSINESS', 
                businessId, 
                businessId, 
                actorUserId, 
                { action: 'UPGRADE_BLOCKED', targetPlan: newPlan, violations: preflight.violations }
            );
            throw new BadRequestException({
                message: 'No puedes cambiar al plan seleccionado por exceder límites actuales.',
                violations: preflight.violations
            });
        }

        const previousPlan = subscription.plan;
        subscription.plan = newPlan;
        
        const saved = await this.subscriptionRepository.save(subscription);

        // Actualización transaccional del fallback legacy opcionalmente
        await this.businessRepository.update(businessId, { plan: newPlan });

        // RECONCILIACIÓN DE CUOTA: Bloquear lo que sobre
        await this.planUsageService.reconcileQuota(businessId);

        await this.auditService.log(
            AuditAction.BUSINESS_STATUS_CHANGED, 
            'SUBSCRIPTION', 
            businessId, 
            businessId, 
            actorUserId, 
            { event: 'SUBSCRIPTION_PLAN_CHANGED', previousPlan, newPlan }
        );

        return saved;
    }

    private isDowngrade(currentPlan: string, newPlan: string): boolean {
        const levels: Record<string, number> = { 'FREE': 0, 'PRO': 1, 'ENTERPRISE': 2, 'BUSINESS': 2 };
        
        // Normalize names (free-3d -> FREE)
        const normalize = (p: string) => p.split('-')[0].toUpperCase();
        
        const curr = levels[normalize(currentPlan)] ?? 0;
        const next = levels[normalize(newPlan)] ?? 0;
        
        return next < curr;
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
            // PAST_DUE permite seguir operando hasta que expire el período de gracia
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

    private async handleMercadoPagoEvent(event: WebhookEvent): Promise<void> {
        const payload = event.payload;
        
        const resourceId = payload.data?.id || payload.id;
        const topic = payload.type || payload.topic;

        if (topic === 'payment' || payload.action?.includes('payment')) {
            const payment = await this.mpService.getPayment(resourceId);
            
            if (payment.status === 'approved') {
                const businessId = payment.metadata?.business_id || payment.metadata?.businessId;
                const planId = payment.metadata?.plan_id || payment.metadata?.planId;

                if (!businessId) throw new Error('BusinessId no encontrado en metadata de MP');

                // 1. Actualizar Suscripción
                const subscription = await this.subscriptionRepository.findOneBy({ businessId });
                if (subscription) {
                    const today = new Date();
                    const currentEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : today;
                    
                    // "Stacking" logic: Si paga antes de vencer, sumamos al vencimiento actual.
                    // Si ya venció o no tenía, empezamos desde hoy.
                    const startDate = currentEnd > today ? currentEnd : today;
                    const nextPeriod = new Date(startDate);
                    nextPeriod.setDate(nextPeriod.getDate() + 30);

                    subscription.status = SubscriptionStatus.ACTIVE;
                    subscription.plan = planId || subscription.plan;
                    subscription.externalPaymentId = payment.id.toString();
                    subscription.lastPaymentAt = today;
                    subscription.currentPeriodStart = startDate;
                    subscription.currentPeriodEnd = nextPeriod;
                    subscription.gracePeriodEndAt = null;

                    await this.subscriptionRepository.save(subscription);
                    
                    // 2. Sincronizar estado del negocio
                    await this.syncBusinessStatusFromSubscription(businessId, SubscriptionStatus.ACTIVE);

                    // 3. Audit
                    await this.auditService.log(
                        AuditAction.RESOURCE_UPDATED, 
                        'SUBSCRIPTION', 
                        businessId, 
                        businessId, 
                        null, 
                        { event: 'MP_PAYMENT_APPROVED', paymentId: payment.id, planId, newExpiry: nextPeriod }
                    );
                }
            }
        }
    }

    /**
     * Degrada un negocio al plan free correspondiente
     */
    async downgradeToFree(businessId: string, actorUserId?: string): Promise<BusinessSubscription> {
        const subscription = await this.subscriptionRepository.findOneBy({ businessId });
        if (!subscription) throw new NotFoundException('Suscripción no encontrada');

        const business = await this.businessRepository.findOneBy({ id: businessId });
        if (!business) throw new NotFoundException('Negocio no encontrado');

        const previousPlan = subscription.plan;

        // Buscar el plan gratuito para esta categoría
        const freePlan = await this.planRepository.findOne({ 
            where: { 
                category: business.category, 
                price: 0,
                active: true 
            },
            order: { sortOrder: 'ASC' }
        }) || await this.planRepository.findOne({ 
            where: { 
                category: null, 
                price: 0,
                active: true 
            },
            order: { sortOrder: 'ASC' }
        });

        const freePlanId = freePlan?.id || 'FREE';
        
        subscription.plan = freePlanId;
        subscription.status = SubscriptionStatus.ACTIVE; // Activo pero en modo free
        subscription.currentPeriodEnd = null;
        subscription.gracePeriodEndAt = null;
        
        const saved = await this.subscriptionRepository.save(subscription);

        // 1. Sincronizar campos legados
        await this.businessRepository.update(businessId, { 
            plan: freePlanId,
            status: BusinessStatus.ACTIVE, // El negocio vuelve a estar activo bajo el plan free
            acceptingOrders: true 
        });

        // 2. RECONCILIACIÓN DE CUOTA: Bloquear lo que sobre inmediatamente
        await this.planUsageService.reconcileQuota(businessId);

        // 3. Notificación Final
        await this.auditService.log(
            AuditAction.BUSINESS_STATUS_CHANGED, 
            'SUBSCRIPTION', 
            businessId, 
            businessId, 
            actorUserId || null, 
            { event: 'AUTO_DOWNGRADE_TO_FREE', previousPlan, nextPlan: freePlanId }
        );

        return saved;
    }

    // --- Webhook Resilience Layer ---

    async recordWebhookEvent(provider: string, eventId: string, type: string, payload: any, businessId?: string): Promise<WebhookEvent> {
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
            if (event.provider === 'MERCADOPAGO') {
                await this.handleMercadoPagoEvent(event);
                event.status = WebhookStatus.PROCESSED;
                event.processedAt = new Date();
                await this.webhookRepository.save(event);
                return;
            }

            const businessId = event.businessId;
            if (!businessId) throw new Error('BusinessId no resuelto para el evento');

            switch (event.eventType) {
                case 'invoice.paid':
                    await this.updateSubscriptionStatus(businessId, SubscriptionStatus.ACTIVE);
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

        const gracePeriod = new Date();
        gracePeriod.setDate(gracePeriod.getDate() + 5);

        subscription.status = SubscriptionStatus.PAST_DUE;
        subscription.gracePeriodEndAt = gracePeriod;

        await this.subscriptionRepository.save(subscription);
        await this.syncBusinessStatusFromSubscription(businessId, SubscriptionStatus.PAST_DUE);
    }
}
