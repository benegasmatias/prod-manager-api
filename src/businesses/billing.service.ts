import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { Business } from './entities/business.entity';
import { PlanUsageService } from './plan-usage.service';
import { PLAN_LIMITS } from './config/plan-limits.config';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { SubscriptionStatus, BusinessStatus } from '../common/enums';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(BusinessSubscription)
        private readonly subscriptionRepository: Repository<BusinessSubscription>,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
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
        const business = await this.businessRepository.findOneBy({ id: businessId });
        if (!business) return;

        let businessStatus = business.status;
        let acceptingOrders = business.acceptingOrders;

        if (status === SubscriptionStatus.SUSPENDED || status === SubscriptionStatus.EXPIRED) {
            businessStatus = BusinessStatus.SUSPENDED;
            acceptingOrders = false;
        } else if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING) {
            // Restaurar si estaba suspendido comercialmente (opcionalmente)
            if (businessStatus === BusinessStatus.SUSPENDED) {
                businessStatus = BusinessStatus.ACTIVE;
                acceptingOrders = true;
            }
        }

        await this.businessRepository.update(businessId, { 
            status: businessStatus, 
            acceptingOrders 
        });
    }
}
