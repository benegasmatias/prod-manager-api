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

    public async getLimitsForPlan(planId: string, category: string = 'IMPRESION_3D'): Promise<any> {
        // 1. Try exact match (e.g. 'free-3d')
        let dbPlan = await this.planRepository.findOneBy({ id: planId });
        
        // 2. If not found and is a generic name, try to map it based on category
        if (!dbPlan && (['FREE', 'PRO', 'BUSINESS'].includes(planId.toUpperCase()))) {
            const suffix = category === 'METALURGICA' ? 'metal' : '3d';
            const mappedId = `${planId.toLowerCase()}-${suffix}`;
            dbPlan = await this.planRepository.findOneBy({ id: mappedId });
        }

        // 3. Last fallback: search for ANY plan of that category with price 0 if seeking FREE
        if (!dbPlan && (planId.toUpperCase() === 'FREE')) {
            dbPlan = await this.planRepository.findOne({
                where: { category, price: 0, active: true },
                order: { sortOrder: 'ASC' }
            });
        }
        
        if (dbPlan) {
            // Map Entity fields to the "limits" structure used by the service
            // We use the first entry of the hardcoded limits as a template for features/defaults
            const baseLimits = PLAN_LIMITS['FREE']; 
            
            return {
                ...baseLimits,
                id: dbPlan.id,
                name: dbPlan.name,
                maxBusinessesPerUser: dbPlan.maxBusinesses ?? baseLimits.maxBusinessesPerUser,
                maxMachinesPerBusiness: dbPlan.maxMachines ?? baseLimits.maxMachinesPerBusiness,
                maxEmployeesPerBusiness: dbPlan.maxUsers ?? baseLimits.maxEmployeesPerBusiness,
                maxOrdersPerMonth: dbPlan.maxOrdersPerMonth ?? baseLimits.maxOrdersPerMonth,
            };
        }

        // Fallback to hardcoded config ONLY if everything else fails (should not happen if seeded)
        return PLAN_LIMITS[planId] || PLAN_LIMITS['FREE'];
    }

    async ensureBusinessCreationAllowed(userId: string): Promise<void> {
        const user = await this.userRepository.findOneBy({ id: userId });
        
        // SUPER_ADMINs can create unlimited businesses
        if (user?.globalRole === 'SUPER_ADMIN') {
            return;
        }

        const userPlan = user?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(userPlan, 'IMPRESION_3D'); 

        const businessCount = await this.businessRepository.countBy({ 
            memberships: { userId } as any
        });

        if (limits.maxBusinessesPerUser !== 0 && businessCount >= limits.maxBusinessesPerUser) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'USER', userId, null, userId, { resource: 'BUSINESSES', usage: businessCount, limit: limits.maxBusinessesPerUser, plan: userPlan });
            this.throwQuotaException('NEGOCIOS', userPlan, limits.maxBusinessesPerUser, businessCount, 'PLAN_BUSINESS_LIMIT_REACHED');
        }
    }

    async ensureMachineCreationAllowed(businessId: string, context?: { ip?: string, userAgent?: string }): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(plan, business.category);
        const machineCount = await this.machineRepository.countBy({ businessId, active: true, blockedByQuota: false });

        if (limits.maxMachinesPerBusiness !== 0 && machineCount >= limits.maxMachinesPerBusiness) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, 
                { resource: 'MACHINES', usage: machineCount, limit: limits.maxMachinesPerBusiness, plan },
                context
            );
            this.throwQuotaException('MACHINES', plan, limits.maxMachinesPerBusiness, machineCount, 'PLAN_MACHINE_LIMIT_REACHED');
        }
    }

    async ensureEmployeeCreationAllowed(businessId: string, context?: { ip?: string, userAgent?: string }): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(plan, business.category);

        // Count both active employees and pending invitations
        const [employeeCount, invitationCount] = await Promise.all([
            this.employeeRepository.countBy({ businessId, active: true, blockedByQuota: false }),
            this.subscriptionRepository.manager.getRepository('BusinessInvitation').count({
                where: { businessId, status: 'PENDING' }
            })
        ]);

        const totalUsage = employeeCount + invitationCount;

        if (limits.maxEmployeesPerBusiness !== 0 && totalUsage >= limits.maxEmployeesPerBusiness) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, 
                { resource: 'EMPLOYEES', usage: totalUsage, limit: limits.maxEmployeesPerBusiness, plan },
                context
            );
            this.throwQuotaException('INTEGRANTES', plan, limits.maxEmployeesPerBusiness, totalUsage, 'PLAN_USER_LIMIT_REACHED');
        }
    }

    async ensureOrderCreationAllowed(businessId: string, context?: { ip?: string, userAgent?: string }): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(plan, business.category);

        // Count orders created this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const orderCount = await this.orderRepository.createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.createdAt >= :startOfMonth', { startOfMonth })
            .getCount();

        if (limits.maxOrdersPerMonth !== 0 && orderCount >= limits.maxOrdersPerMonth) {
            await this.auditService.log(AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, 
                { resource: 'ORDERS', usage: orderCount, limit: limits.maxOrdersPerMonth, plan },
                context
            );
            this.throwQuotaException('ORDERS', plan, limits.maxOrdersPerMonth, orderCount, 'PLAN_MONTHLY_ORDER_LIMIT_REACHED');
        }
    }

    async getBusinessUsage(businessId: string): Promise<any> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        if (!business) throw new ForbiddenException('Negocio no encontrado');

        const planId = business?.subscription?.plan || business?.plan || 'FREE';
        const status = business?.subscription?.status || 'ACTIVE';
        const limits = await this.getLimitsForPlan(planId, business.category);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [machines, employees, orders, blockedMachines, blockedEmployees] = await Promise.all([
            this.machineRepository.countBy({ businessId, active: true, blockedByQuota: false }),
            this.employeeRepository.countBy({ businessId, active: true, blockedByQuota: false }),
            this.orderRepository.createQueryBuilder('order')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.createdAt >= :startOfMonth', { startOfMonth })
                .getCount(),
            this.machineRepository.countBy({ businessId, active: true, blockedByQuota: true }),
            this.employeeRepository.countBy({ businessId, active: true, blockedByQuota: true }),
        ]);

        const usage = {
            users: employees,
            machines: machines,
            ordersThisMonth: orders,
            blockedUsers: blockedEmployees,
            blockedMachines: blockedMachines,
        };

        const max = {
            users: limits.maxEmployeesPerBusiness,
            machines: limits.maxMachinesPerBusiness,
            orders: limits.maxOrdersPerMonth
        };

        return {
            plan: {
                id: limits.id || planId,
                name: limits.name,
                category: business.category
            },
            limits: max,
            usage,
            canCreate: {
                users: max.users === 0 || usage.users < max.users,
                machines: max.machines === 0 || usage.machines < max.machines,
                orders: max.orders === 0 || usage.ordersThisMonth < max.orders
            }
        };
    }

    async reconcileQuota(businessId: string): Promise<void> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        if (!business) return;

        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = await this.getLimitsForPlan(plan, business.category);

        // 1. Reconcile Machines
        const machines = await this.machineRepository.find({
            where: { businessId, active: true },
            order: { createdAt: 'ASC' }
        });

        const maxMachines = Number(limits.maxMachinesPerBusiness);
        for (let i = 0; i < machines.length; i++) {
            const shouldBeBlocked = maxMachines !== 0 && i >= maxMachines;
            if (machines[i].blockedByQuota !== shouldBeBlocked) {
                machines[i].blockedByQuota = shouldBeBlocked;
                await this.machineRepository.save(machines[i]);
            }
        }

        // 2. Reconcile Employees
        const employees = await this.employeeRepository.find({
            where: { businessId, active: true },
            order: { createdAt: 'ASC' }
        });

        const maxEmployees = Number(limits.maxEmployeesPerBusiness);
        let activeNonOwnerCount = 0;
        for (let i = 0; i < employees.length; i++) {
            // The owner should NEVER be blocked by quota
            if (employees[i].role === 'OWNER') {
                if (employees[i].blockedByQuota) {
                    employees[i].blockedByQuota = false;
                    await this.employeeRepository.save(employees[i]);
                }
                continue;
            }

            activeNonOwnerCount++;
            // Note: maxEmployees includes the owner, so we check total humans
            // But if maxEmployees is 1, it only allows the owner.
            const totalHumansAllowed = maxEmployees !== 0 ? maxEmployees : 9999;
            const shouldBeBlocked = (i + 1) > totalHumansAllowed;
            
            if (employees[i].blockedByQuota !== shouldBeBlocked) {
                employees[i].blockedByQuota = shouldBeBlocked;
                await this.employeeRepository.save(employees[i]);
            }
        }

        await this.auditService.log(
            AuditAction.RESOURCE_UPDATED, 
            'BUSINESS', 
            businessId, 
            businessId, 
            null, 
            { event: 'QUOTA_RECONCILED', plan, maxMachines, maxEmployees }
        );
    }

    private throwQuotaException(resource: string, plan: string, limit: number, usage: number, errorCode: string) {
        const suggestedPlan = plan === 'FREE' ? 'PRO' : 'ENTERPRISE';

        throw new ForbiddenException({
            statusCode: 403,
            message: `Has alcanzado el límite de tu plan para ${resource}. (${usage}/${limit})`,
            errorCode,
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
