import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Employee } from '../employees/entities/employee.entity';
import { PLAN_LIMITS, PlanLimits } from './config/plan-limits.config';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { Order } from '../orders/entities/order.entity';
import { SubscriptionPlan } from '../admin/entities/subscription-plan.entity';

@Injectable()
export class PlanUsageService {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Machine)
        private readonly machineRepository: Repository<Machine>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(BusinessSubscription)
        private readonly subscriptionRepository: Repository<BusinessSubscription>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(SubscriptionPlan)
        private readonly planRepository: Repository<SubscriptionPlan>,
        private readonly auditService: AuditService,
    ) { }

    public async getLimitsForPlan(planId: string): Promise<any> {
        // First try to find the plan in the database
        const dbPlan = await this.planRepository.findOneBy({ id: planId });
        
        if (dbPlan) {
            // Map Entity fields to the "limits" structure used by the service
            // Note: We merge with PLAN_LIMITS to preserve feature flags which are not in the DB yet
            const baseLimits = PLAN_LIMITS[planId] || PLAN_LIMITS['FREE'];
            return {
                ...baseLimits,
                name: dbPlan.name,
                maxBusinessesPerUser: dbPlan.maxBusinesses || baseLimits.maxBusinessesPerUser,
                maxMachinesPerBusiness: dbPlan.maxMachines || baseLimits.maxMachinesPerBusiness,
                maxEmployeesPerBusiness: dbPlan.maxUsers || baseLimits.maxEmployeesPerBusiness,
                maxOrdersPerMonth: dbPlan.maxOrdersPerMonth || baseLimits.maxOrdersPerMonth,
            };
        }

        // Fallback to hardcoded config if not found in DB
        return PLAN_LIMITS[planId] || PLAN_LIMITS['FREE'];
    }

    async ensureBusinessCreationAllowed(userId: string): Promise<void> {
        const user = await this.userRepository.findOneBy({ id: userId });
        const userPlan = user?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(userPlan);

        const businessCount = await this.businessRepository.countBy({ 
            memberships: { userId } as any
        });

        if (limits.maxBusinessesPerUser !== 0 && businessCount >= limits.maxBusinessesPerUser) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'USER', userId, null, userId, { resource: 'BUSINESSES', usage: businessCount, limit: limits.maxBusinessesPerUser, plan: userPlan });
            this.throwQuotaException('BUSINESSES', userPlan, limits.maxBusinessesPerUser, businessCount);
        }
    }

    async ensureMachineCreationAllowed(businessId: string): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(plan);

        const machineCount = await this.machineRepository.countBy({ businessId, active: true });

        if (limits.maxMachinesPerBusiness !== 0 && machineCount >= limits.maxMachinesPerBusiness) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, { resource: 'MACHINES', usage: machineCount, limit: limits.maxMachinesPerBusiness, plan });
            this.throwQuotaException('MACHINES', plan, limits.maxMachinesPerBusiness, machineCount);
        }
    }

    async ensureEmployeeCreationAllowed(businessId: string): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(plan);

        const employeeCount = await this.employeeRepository.countBy({ businessId, active: true });

        if (limits.maxEmployeesPerBusiness !== 0 && employeeCount >= limits.maxEmployeesPerBusiness) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, { resource: 'EMPLOYEES', usage: employeeCount, limit: limits.maxEmployeesPerBusiness, plan });
            this.throwQuotaException('EMPLOYEES', plan, limits.maxEmployeesPerBusiness, employeeCount);
        }
    }

    async ensureOrderCreationAllowed(businessId: string): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(plan);

        // Count orders created this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const orderCount = await this.orderRepository.createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.createdAt >= :startOfMonth', { startOfMonth })
            .getCount();

        if (limits.maxOrdersPerMonth !== 0 && orderCount >= limits.maxOrdersPerMonth) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, { resource: 'ORDERS', usage: orderCount, limit: limits.maxOrdersPerMonth, plan });
            this.throwQuotaException('ORDERS', plan, limits.maxOrdersPerMonth, orderCount);
        }
    }

    async getBusinessUsage(businessId: string): Promise<any> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const status = business?.subscription?.status || 'ACTIVE';
        const limits = await this.getLimitsForPlan(plan);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [machines, employees, orders] = await Promise.all([
            this.machineRepository.countBy({ businessId, active: true }),
            this.employeeRepository.countBy({ businessId, active: true }),
            this.orderRepository.createQueryBuilder('order')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.createdAt >= :startOfMonth', { startOfMonth })
                .getCount()
        ]);

        return {
            plan,
            status,
            limits,
            usage: {
                MACHINES: machines,
                EMPLOYEES: employees,
                ORDERS: orders,
            },
            remaining: {
                MACHINES: limits.maxMachinesPerBusiness === 0 ? Infinity : Math.max(0, limits.maxMachinesPerBusiness - machines),
                EMPLOYEES: limits.maxEmployeesPerBusiness === 0 ? Infinity : Math.max(0, limits.maxEmployeesPerBusiness - employees),
                ORDERS: limits.maxOrdersPerMonth === 0 ? Infinity : Math.max(0, limits.maxOrdersPerMonth - orders),
            }
        };
    }

    private throwQuotaException(resource: string, plan: string, limit: number, usage: number) {
        const suggestedPlan = plan === 'FREE' ? 'PRO' : 'ENTERPRISE';

        throw new ForbiddenException({
            statusCode: 403,
            message: `Límite excedido para ${resource} en plan ${plan}. (${usage}/${limit})`,
            errorCode: 'QUOTA_EXCEEDED',
            metadata: {
                resource,
                plan,
                limit,
                usage,
                remaining: 0,
                suggestedPlan
            }
        });
    }
}
