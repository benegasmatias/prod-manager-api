import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual, In } from 'typeorm';
import { Business } from './entities/business.entity';
import { BusinessTemplateDto } from './dto/business-template.dto';
import { BusinessMembership } from './entities/business-membership.entity';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { BusinessRole } from '../common/enums';
import { User } from '../users/entities/user.entity';
import { BusinessTemplate } from './entities/business-template.entity';
import { BusinessInvitation } from './entities/business-invitation.entity';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Machine } from '../machines/entities/machine.entity';
import { MachineStatus, OrderStatus, OrderType, BusinessStatus } from '../common/enums';
import { Material } from '../materials/entities/material.entity';
import { DashboardSummaryDto, DashboardAlertDto } from './dto/dashboard-summary.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Employee } from '../employees/entities/employee.entity';
import { BusinessStrategyProvider } from './strategies/business-strategy.provider';
import { PlanUsageService } from './plan-usage.service';
import { BillingService } from './billing.service';
import { PLAN_LIMITS } from './config/plan-limits.config';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { AdminService } from '../admin/admin.service';

const DEFAULT_BASE_CONFIG = {
    sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/ajustes'],
    labels: { produccion: 'Producción', items: 'Trabajos' },
    icons: { pedidos: 'Box', produccion: 'Cpu' },
    stats: [
        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' }
    ],
    productionStages: [
        { key: 'PENDING', label: 'Pendiente', color: 'bg-zinc-100' },
        { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' }
    ],
    itemFields: [
        { key: 'nombreProducto', label: 'Nombre / Trabajo', tipo: 'text', required: true }
    ],
    features: { hasMaterials: false, hasVisits: false },
};

@Injectable()
export class BusinessesService {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(BusinessMembership)
        private readonly membershipRepository: Repository<BusinessMembership>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(BusinessTemplate)
        private readonly templateRepository: Repository<BusinessTemplate>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        @InjectRepository(Machine)
        private readonly machineRepository: Repository<Machine>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        private readonly planUsageService: PlanUsageService,
        private readonly auditService: AuditService,
        private readonly billingService: BillingService,
        private readonly adminService: AdminService,
        private readonly dataSource: DataSource,
        private readonly strategyProvider: BusinessStrategyProvider,
    ) { }

    async getTemplates(userId?: string): Promise<BusinessTemplateDto[]> {
        const templates = await this.templateRepository.find({
            where: { isEnabled: true, key: In(['IMPRESION_3D', 'KIOSCO']) as any }
        });

        let userPlan = 'FREE';
        if (userId) {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (user) userPlan = user.plan || 'FREE';
        }

        return templates.map(t => {
            const { accessible, reason } = this.checkPlanAccessibility(userPlan, t.requiredPlan);
            return {
                key: t.key,
                name: t.name,
                description: t.description,
                imageKey: t.imageKey,
                isAvailable: t.isAvailable,
                isComingSoon: t.isComingSoon,
                requiredPlan: t.requiredPlan,
                accessible,
                accessReason: reason
            };
        });
    }

    private checkPlanAccessibility(userPlan: string, requiredPlan: string): { accessible: boolean, reason?: string } {
        const levels: any = { 'FREE': 0, 'PRO': 1, 'ENTERPRISE': 2 };
        const userLevel = levels[userPlan] || 0;
        const requiredLevel = levels[requiredPlan] || 0;

        if (userLevel >= requiredLevel) {
            return { accessible: true };
        }

        return { 
            accessible: false, 
            reason: `Este rubro requiere un plan ${requiredPlan}. Tu plan actual es ${userPlan}.` 
        };
    }

    async createFromTemplate(userId: string, createDto: CreateBusinessFromTemplateDto): Promise<any> {
        await this.planUsageService.ensureBusinessCreationAllowed(userId);

        const { templateKey, name, phone, email } = createDto;
        
        // Restricción: Permitimos IMPRESION_3D y KIOSCO por ahora
        if (!['IMPRESION_3D', 'KIOSCO'].includes(templateKey)) {
            throw new ForbiddenException(`Por el momento solo se permite crear negocios de Impresión 3D o Kiosco`);
        }

        const template = await this.templateRepository.findOneBy({ key: templateKey as any });

        if (!template) {
            throw new NotFoundException(`Template with key ${templateKey} not found`);
        }

        return await this.dataSource.transaction(async (manager) => {
            // Fallback de capacidades si el template en DB no las tiene cargadas todavía
            let defaultCaps = template?.defaultCapabilities || [];
            if (defaultCaps.length === 0) {
                if (templateKey === 'IMPRESION_3D') {
                    defaultCaps = ['PRODUCTION_MANAGEMENT', 'PRODUCTION_MACHINES', 'INVENTORY_RAW', 'SALES_MANAGEMENT'];
                } else if (templateKey === 'KIOSCO') {
                    defaultCaps = ['SALES_MANAGEMENT', 'INVENTORY_RETAIL', 'FINANCIAL_BASIC'];
                }
            }

            const business = manager.create(Business, {
                name: name || (template ? `${template.name} - Mi Espacio` : 'Mi Negocio'),
                category: templateKey,
                status: 'ACTIVE',
                onboardingStep: 'COMPLETED',
                plan: 'FREE',
                capabilities: [], // Will be initialized by AdminService below
                phone,
                email
            });
            const businessToUse = await manager.save(Business, business);

            // Centrally initialize capabilities from template + system defaults
            // This avoids hardcoding capabilities here in the creation flow
            await this.adminService.initializeCapabilitiesForNewBusiness(businessToUse);

            // Fase 5.2: Suscripción por defecto (Atómica)
            await this.billingService.createDefaultSubscription(businessToUse.id, manager);

            await manager.save(BusinessMembership, manager.create(BusinessMembership, {
                userId,
                businessId: businessToUse.id,
                role: BusinessRole.OWNER
            }));

            const user = await manager.findOneBy(User, { id: userId });
            if (user) {
                const nameParts = (user.fullName || 'Propietario').split(' ');
                await manager.save(Employee, manager.create(Employee, {
                    businessId: businessToUse.id,
                    firstName: nameParts[0] || 'Propietario',
                    lastName: nameParts.slice(1).join(' '),
                    email: user.email,
                    active: true,
                    role: 'OWNER'
                }));
                
                if (!user.defaultBusinessId) {
                    user.defaultBusinessId = businessToUse.id;
                    await manager.save(User, user);
                }
            }

            return { businessId: businessToUse.id, status: 'DRAFT', onboardingStep: 'BASIC_INFO' };
        });
    }

    async updateOnboardingStep(userId: string, businessId: string, step: string): Promise<any> {
        const business = await this.findOne(userId, businessId);
        business.onboardingStep = step;
        await this.businessRepository.save(business);
        return { businessId, onboardingStep: step };
    }

    async activateBusiness(userId: string, businessId: string): Promise<any> {
        const business = await this.findOne(userId, businessId);
        if (business.status === 'ACTIVE') return { businessId, status: 'ACTIVE' };

        const previousStatus = business.status;
        business.status = 'ACTIVE';
        business.onboardingCompleted = true;
        business.onboardingStep = 'DONE';
        business.statusUpdatedAt = new Date();
        
        await this.businessRepository.save(business);

        await this.auditService.log(
            AuditAction.BUSINESS_ACTIVATED,
            'BUSINESS',
            businessId,
            businessId,
            userId,
            { previousStatus, newStatus: 'ACTIVE' }
        );

        return { businessId, status: 'ACTIVE', message: 'Activado con éxito.' };
    }

    async updateStatusAdmin(businessId: string, newStatus: string, reasonCode?: string, reasonText?: string): Promise<any> {
        const business = await this.businessRepository.findOneBy({ id: businessId });
        if (!business) throw new NotFoundException('Negocio no encontrado');

        const oldStatus = business.status;
        const oldEnabled = business.isEnabled;

        business.status = newStatus;
        business.statusUpdatedAt = new Date();
        if (reasonCode) business.statusReasonCode = reasonCode;
        if (reasonText) business.statusReasonText = reasonText;

        if (newStatus === 'ARCHIVED') {
             business.isEnabled = false;
        }

        await this.businessRepository.save(business);

        // --- AUDIT LOGS ---
        if (oldStatus !== newStatus) {
            await this.auditService.log(
                AuditAction.BUSINESS_STATUS_CHANGED,
                'BUSINESS',
                businessId,
                businessId,
                null,
                { oldStatus, newStatus, reasonCode, reasonText }
            );

            if (newStatus === 'ARCHIVED') {
                await this.auditService.log(AuditAction.BUSINESS_ARCHIVED, 'BUSINESS', businessId, businessId, null, { reasonCode });
            }
        }

        if (oldEnabled !== business.isEnabled) {
            await this.auditService.log(
                AuditAction.BUSINESS_ENABLED_CHANGED,
                'BUSINESS',
                businessId,
                businessId,
                null,
                { previousValue: oldEnabled, newValue: business.isEnabled, reasonCode, reasonText }
            );
        }
        // ------------------

        return { businessId, status: newStatus, isEnabled: business.isEnabled };
    }

    async updateEnabledAdmin(businessId: string, isEnabled: boolean, reasonCode?: string, reasonText?: string): Promise<any> {
        const business = await this.businessRepository.findOneBy({ id: businessId });
        if (!business) throw new NotFoundException('Negocio no encontrado');

        const previousValue = business.isEnabled;
        if (previousValue === isEnabled) return { businessId, isEnabled };

        business.isEnabled = isEnabled;
        business.statusUpdatedAt = new Date();
        if (reasonCode) business.statusReasonCode = reasonCode;
        if (reasonText) business.statusReasonText = reasonText;

        await this.businessRepository.save(business);

        await this.auditService.log(
            AuditAction.BUSINESS_ENABLED_CHANGED,
            'BUSINESS',
            businessId,
            businessId,
            null,
            { previousValue, newValue: isEnabled, reasonCode, reasonText }
        );

        return { businessId, isEnabled, status: business.status };
    }

    async getBusinessAuditLogs(businessId: string): Promise<any> {
        return this.auditService.findByBusiness(businessId);
    }

    async getBusinessUsage(businessId: string): Promise<any> {
        return this.planUsageService.getBusinessUsage(businessId);
    }

    async resolveBusinessConfig(userId: string, businessId: string): Promise<any> {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        if (!business) throw new ForbiddenException('Negocio no encontrado');

        const template = await this.templateRepository.findOneBy({ key: business.category });
        
        let config = JSON.parse(JSON.stringify(DEFAULT_BASE_CONFIG));

        if (template?.config) {
            config = {
                ...config,
                ...template.config,
                features: { ...config.features, ...(template.config.features || {}) }
            };
        }

        // SaaS Gating (Subscription Source of Truth)
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const subscriptionStatus = business?.subscription?.status || 'ACTIVE';
        const limits = await this.planUsageService.getLimitsForPlan(plan);
        if (config.features) {
            config.features.hasMaterials = limits.features.hasMaterials;
        }

        if (business.capabilitiesOverride) {
            config = { ...config, ...business.capabilitiesOverride };
        }

        // RBAC Context
        const membership = await this.membershipRepository.findOneBy({ userId, businessId });
        const userRole = membership?.role || BusinessRole.OPERATOR;
        const userPermissions = this.getPermissionsForRole(userRole);

        return { 
            businessId: business.id, 
            config,
            userRole,
            userPermissions,
            subscription: {
                planId: plan,
                planName: limits.name || plan,
                status: subscriptionStatus,
                currentPeriodEnd: business?.subscription?.currentPeriodEnd,
                trialEndAt: business?.subscription?.trialEndAt,
                cancelAtPeriodEnd: business?.subscription?.cancelAtPeriodEnd || false
            }
        };
    }

    private getPermissionsForRole(role: BusinessRole) {
        const matrix: any = {
            [BusinessRole.OWNER]: {
                employees: { canRead: true, canManage: true },
                audit: { canRead: true, canManage: true },
                config_admin: { canRead: true, canManage: true },
                materials: { canRead: true, canManage: true },
                stockMoves: { canCreate: true },
                machines: { canRead: true, canManage: true, canUpdateStatus: true },
                payments: { canRead: true, canManage: true },
                orders: { canRead: true, canManage: true, canUpdateStatus: true, canReadFinancials: true },
            },
            [BusinessRole.BUSINESS_ADMIN]: {
                employees: { canRead: true, canManage: true },
                audit: { canRead: true, canManage: false },
                config_admin: { canRead: true, canManage: false },
                materials: { canRead: true, canManage: true },
                stockMoves: { canCreate: true },
                machines: { canRead: true, canManage: true, canUpdateStatus: true },
                payments: { canRead: true, canManage: true },
                orders: { canRead: true, canManage: true, canUpdateStatus: true, canReadFinancials: true },
            },
            [BusinessRole.SALES]: {
                employees: { canRead: true, canManage: false },
                audit: { canRead: false, canManage: false },
                config_admin: { canRead: false, canManage: false },
                materials: { canRead: true, canManage: false },
                stockMoves: { canCreate: false },
                machines: { canRead: true, canManage: false, canUpdateStatus: false },
                payments: { canRead: true, canManage: true },
                orders: { canRead: true, canManage: true, canUpdateStatus: true, canReadFinancials: true },
            },
            [BusinessRole.OPERATOR]: {
                employees: { canRead: false, canManage: false },
                audit: { canRead: false, canManage: false },
                config_admin: { canRead: false, canManage: false },
                materials: { canRead: true, canManage: false },
                stockMoves: { canCreate: true },
                machines: { canRead: true, canManage: false, canUpdateStatus: true },
                payments: { canRead: false, canManage: false },
                orders: { canRead: true, canManage: false, canUpdateStatus: true, canReadFinancials: false },
            },
            [BusinessRole.VIEWER]: {
                employees: { canRead: true, canManage: false },
                audit: { canRead: false, canManage: false },
                config_admin: { canRead: true, canManage: false },
                materials: { canRead: true, canManage: false },
                stockMoves: { canCreate: false },
                machines: { canRead: true, canManage: false, canUpdateStatus: false },
                payments: { canRead: false, canManage: false },
                orders: { canRead: true, canManage: false, canUpdateStatus: false, canReadFinancials: false },
            }
        };

        return matrix[role] || matrix[BusinessRole.VIEWER];
    }

    async getDashboardSummary(userId: string, businessId: string): Promise<DashboardSummaryDto> {
        const hasAccess = await this.checkAccess(userId, businessId);
        if (!hasAccess) throw new ForbiddenException('Sin acceso');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ACTIVE_WORKING_STATUSES = [
            OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.CONFIRMED,
            OrderStatus.READY, OrderStatus.DONE, OrderStatus.DESIGN,
            OrderStatus.CUTTING, OrderStatus.WELDING, OrderStatus.ASSEMBLY,
            OrderStatus.PAINTING, OrderStatus.BARNIZADO, OrderStatus.POST_PROCESS,
            OrderStatus.REPRINT_PENDING, OrderStatus.RE_WORK, OrderStatus.IN_STOCK,
            OrderStatus.SITE_VISIT, OrderStatus.SITE_VISIT_DONE, OrderStatus.VISITA_REPROGRAMADA, 
            OrderStatus.QUOTATION, OrderStatus.BUDGET_GENERATED, OrderStatus.SURVEY_DESIGN, OrderStatus.APPROVED,
            OrderStatus.OFFICIAL_ORDER, OrderStatus.INSTALACION_OBRA
        ];

        const PRODUCTION_STATUSES = [
            OrderStatus.IN_PROGRESS, OrderStatus.DESIGN, OrderStatus.CUTTING,
            OrderStatus.WELDING, OrderStatus.ASSEMBLY, OrderStatus.PAINTING,
            OrderStatus.BARNIZADO, OrderStatus.POST_PROCESS, OrderStatus.RE_WORK,
            OrderStatus.OFFICIAL_ORDER
        ];

        const business = await this.businessRepository.findOneBy({ id: businessId });
        const capabilities = business?.capabilities || [];
        const hasProduction = capabilities.includes('PRODUCTION_MANAGEMENT');
        const hasMachines = capabilities.includes('PRODUCTION_MACHINES');

        const [
            salesResult,
            activeOrdersWithItems,
            activeMachinesCount,
            productionOrdersCount,
            newCustomersCount,
            recentOrders,
            realOverdue
        ] = await Promise.all([
            // Sales/Core (Everyone needs this for now)
            this.orderRepository.createQueryBuilder('order')
                .select('SUM(order.totalPrice)', 'total')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.DONE] })
                .getRawOne(),
            
            this.orderRepository.find({
                where: { businessId, status: In(ACTIVE_WORKING_STATUSES) },
                relations: ['items', 'siteInfo']
            }),

            // Capability-Gated: Machines
            hasMachines ? this.machineRepository.count({
                where: { businessId, status: MachineStatus.PRINTING }
            }) : Promise.resolve(0),

            // Capability-Gated: Production
            hasProduction ? this.orderRepository.count({
                where: { businessId, status: In(PRODUCTION_STATUSES) }
            }) : Promise.resolve(0),

            // Customers/Core
            this.customerRepository.count({
                where: { businessId, createdAt: MoreThanOrEqual(thirtyDaysAgo) }
            }),

            this.orderRepository.find({
                where: { businessId },
                order: { updatedAt: 'DESC' },
                take: 5
            }),

            this.orderRepository.createQueryBuilder('order')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status NOT IN (:...finalStatuses)', { finalStatuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] })
                .andWhere('order.type != :stockType', { stockType: OrderType.STOCK })
                .andWhere('LOWER(order.clientName) != :stockName', { stockName: 'stock' })
                .andWhere('order.dueDate < :now', { now: new Date() })
                .getMany()
        ]);

        const pendingBalance = activeOrdersWithItems.reduce((acc, order) => {
            const total = Number(order.totalPrice) || 0;
            const deposits = order.items?.reduce((iAcc, item) => iAcc + Number(item.deposit || 0), 0) || 0;
            const payments = order.payments?.reduce((iAcc, p) => iAcc + Number(p.amount || 0), 0) || 0;
            return acc + (total - deposits - payments);
        }, 0);

        const strategy = this.strategyProvider.getStrategy(business?.category);
        const now = new Date();
        const context = {
            activeOrders: activeOrdersWithItems,
            realOverdueCount: realOverdue.length,
            todayStr: now.toISOString().split('T')[0],
            nextWeekDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        };

        const operationalCounters = strategy.getOperationalCounters(context);
        const pipelineSummary = strategy.getPipelineSummary(context);
        const calendarEvents = strategy.getCalendarEvents(context);

        const alerts: any[] = [];
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000;
        
        const limitThreeDays = new Date(now.getTime() + THREE_DAYS_MS);
        const limitOneDay = new Date(now.getTime() + ONE_DAY_MS);

        // 1. Alerta de pedidos CRÍTICOS (Hoy o Mañana)
        const criticalOrders = activeOrdersWithItems.filter(o => {
            if (!o.dueDate || o.status === OrderStatus.DELIVERED) return false;
            const d = new Date(o.dueDate);
            return d > now && d <= limitOneDay;
        });

        if (criticalOrders.length > 0) {
            alerts.push({
                type: 'critical',
                title: 'Entregas Inminentes',
                message: `¡Atención! Tenés ${criticalOrders.length} pedidos que vencen HOY o MAÑANA.`,
                actionLabel: 'Priorizar Ahora',
                actionLink: '/pedidos'
            });
        }

        // 2. Alerta de pedidos próximos a vencer (3 días)
        const upcomingOrders = activeOrdersWithItems.filter(o => {
            if (!o.dueDate || o.status === OrderStatus.DELIVERED) return false;
            const d = new Date(o.dueDate);
            // Solo los que no están ya en el balde de "críticos"
            return d > limitOneDay && d <= limitThreeDays;
        });

        if (upcomingOrders.length > 0) {
            alerts.push({
                type: 'warning',
                title: 'Próximos Vencimientos',
                message: `Tenés ${upcomingOrders.length} pedidos para entregar en los próximos 3 días.`,
                actionLabel: 'Ver Agenda',
                actionLink: '/pedidos'
            });
        }

        // 3. Alerta de pedidos vencidos
        if (realOverdue.length > 0) {
            alerts.push({
                type: 'error',
                title: 'Pedidos Vencidos',
                message: `Hay ${realOverdue.length} pedidos con fecha de entrega cumplida sin entregar.`,
                actionLabel: 'Revisar Mora',
                actionLink: '/pedidos'
            });
        }

        return {
            totalSales: Number(salesResult?.total) || 0,
            pendingBalance,
            activeOrders: activeOrdersWithItems.length,
            productionOrders: productionOrdersCount,
            activeMachines: activeMachinesCount,
            newCustomers: newCustomersCount,
            recentOrders: recentOrders.map(o => ({ id: o.id, clientName: o.clientName, total: Number(o.totalPrice), status: o.status, dueDate: o.dueDate, type: o.type })),
            alerts, 
            trends: null,
            operationalCounters,
            pipelineSummary,
            calendarEvents
        };
    }

    async findOne(userId: string, id: string): Promise<Business> {
        const hasAccess = await this.checkAccess(userId, id);
        if (!hasAccess) throw new ForbiddenException('Acceso denegado');
        const business = await this.businessRepository.findOneBy({ id });
        if (!business) throw new NotFoundException('No encontrado');
        return business;
    }

    async hasCapability(userId: string, businessId: string, capability: string): Promise<boolean> {
        const business = await this.findOne(userId, businessId);
        return business.capabilities?.includes(capability) || false;
    }

    async update(userId: string, id: string, updateDto: UpdateBusinessDto): Promise<Business> {
        await this.findOne(userId, id);
        await this.businessRepository.update(id, updateDto);
        return this.findOne(userId, id);
    }

    async findUserBusinesses(userId: string, filters?: any): Promise<any[]> {
        const query = this.membershipRepository.createQueryBuilder('membership')
            .innerJoinAndSelect('membership.business', 'business')
            .where('membership.userId = :userId', { userId });

        if (filters?.isEnabled !== undefined) {
            query.andWhere('business.isEnabled = :isEnabled', { isEnabled: filters.isEnabled });
        }
        if (filters?.status) {
            query.andWhere('business.status = :status', { status: filters.status });
        }

        const memberships = await query.getMany();
        return memberships.map(m => ({
            ...m.business,
            userRole: m.role
        }));
    }

    async checkAccess(userId: string, businessId: string): Promise<boolean> {
        return (await this.membershipRepository.countBy({ userId, businessId })) > 0;
    }

    async addMemberToBusiness(userId: string, businessId: string, role: string): Promise<BusinessMembership> {
        let m = await this.membershipRepository.findOne({ where: { userId, businessId } });
        if (!m) m = this.membershipRepository.create({ userId, businessId, role: role as any });
        else m.role = role as any;
        return this.membershipRepository.save(m);
    }

    async delete(businessId: string): Promise<any> {
        return await this.dataSource.transaction(async (manager) => {
            // Delete associated data in order
            await manager.delete(Employee, { businessId });
            await manager.delete(BusinessSubscription, { businessId });
            await manager.delete(BusinessInvitation, { businessId });
            await manager.delete(BusinessMembership, { businessId });
            await manager.delete(Business, { id: businessId });
            return { businessId, deleted: true };
        });
    }
}
