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
exports.BusinessesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const business_entity_1 = require("./entities/business.entity");
const business_membership_entity_1 = require("./entities/business-membership.entity");
const enums_1 = require("../common/enums");
const user_entity_1 = require("../users/entities/user.entity");
const business_template_entity_1 = require("./entities/business-template.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const machine_entity_1 = require("../machines/entities/machine.entity");
const enums_2 = require("../common/enums");
const material_entity_1 = require("../materials/entities/material.entity");
const employee_entity_1 = require("../employees/entities/employee.entity");
const business_strategy_provider_1 = require("./strategies/business-strategy.provider");
const plan_usage_service_1 = require("./plan-usage.service");
const billing_service_1 = require("./billing.service");
const plan_limits_config_1 = require("./config/plan-limits.config");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
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
let BusinessesService = class BusinessesService {
    constructor(businessRepository, membershipRepository, userRepository, templateRepository, orderRepository, customerRepository, machineRepository, materialRepository, employeeRepository, planUsageService, auditService, billingService, dataSource, strategyProvider) {
        this.businessRepository = businessRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.machineRepository = machineRepository;
        this.materialRepository = materialRepository;
        this.employeeRepository = employeeRepository;
        this.planUsageService = planUsageService;
        this.auditService = auditService;
        this.billingService = billingService;
        this.dataSource = dataSource;
        this.strategyProvider = strategyProvider;
    }
    async getTemplates(userId) {
        const templates = await this.templateRepository.find({
            where: { isEnabled: true }
        });
        let userPlan = 'FREE';
        if (userId) {
            const user = await this.userRepository.findOneBy({ id: userId });
            if (user)
                userPlan = user.plan || 'FREE';
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
    checkPlanAccessibility(userPlan, requiredPlan) {
        const levels = { 'FREE': 0, 'PRO': 1, 'ENTERPRISE': 2 };
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
    async createFromTemplate(userId, createDto) {
        await this.planUsageService.ensureBusinessCreationAllowed(userId);
        const { templateKey, name } = createDto;
        const template = await this.templateRepository.findOneBy({ key: templateKey });
        if (!template && templateKey !== 'GENERICO') {
            throw new common_1.NotFoundException(`Template with key ${templateKey} not found`);
        }
        return await this.dataSource.transaction(async (manager) => {
            const business = manager.create(business_entity_1.Business, {
                name: name || (template ? `${template.name} - Mi Espacio` : 'Mi Negocio'),
                category: templateKey,
                status: 'DRAFT',
                onboardingStep: 'BASIC_INFO',
                plan: 'FREE'
            });
            const businessToUse = await manager.save(business_entity_1.Business, business);
            const initialPlan = template?.requiredPlan || 'FREE';
            await this.billingService.createDefaultSubscription(businessToUse.id, initialPlan, manager);
            await manager.save(business_membership_entity_1.BusinessMembership, manager.create(business_membership_entity_1.BusinessMembership, {
                userId,
                businessId: businessToUse.id,
                role: enums_1.BusinessRole.OWNER
            }));
            const user = await manager.findOneBy(user_entity_1.User, { id: userId });
            if (user) {
                const nameParts = (user.fullName || 'Propietario').split(' ');
                await manager.save(employee_entity_1.Employee, manager.create(employee_entity_1.Employee, {
                    businessId: businessToUse.id,
                    firstName: nameParts[0] || 'Propietario',
                    lastName: nameParts.slice(1).join(' '),
                    email: user.email,
                    active: true,
                    role: 'OWNER'
                }));
                if (!user.defaultBusinessId) {
                    user.defaultBusinessId = businessToUse.id;
                    await manager.save(user_entity_1.User, user);
                }
            }
            return { businessId: businessToUse.id, status: 'DRAFT', onboardingStep: 'BASIC_INFO' };
        });
    }
    async updateOnboardingStep(userId, businessId, step) {
        const business = await this.findOne(userId, businessId);
        business.onboardingStep = step;
        await this.businessRepository.save(business);
        return { businessId, onboardingStep: step };
    }
    async activateBusiness(userId, businessId) {
        const business = await this.findOne(userId, businessId);
        if (business.status === 'ACTIVE')
            return { businessId, status: 'ACTIVE' };
        const previousStatus = business.status;
        business.status = 'ACTIVE';
        business.onboardingCompleted = true;
        business.onboardingStep = 'DONE';
        business.statusUpdatedAt = new Date();
        await this.businessRepository.save(business);
        await this.auditService.log(audit_log_entity_1.AuditAction.BUSINESS_ACTIVATED, 'BUSINESS', businessId, businessId, userId, { previousStatus, newStatus: 'ACTIVE' });
        return { businessId, status: 'ACTIVE', message: 'Activado con éxito.' };
    }
    async updateStatusAdmin(businessId, newStatus, reasonCode, reasonText) {
        const business = await this.businessRepository.findOneBy({ id: businessId });
        if (!business)
            throw new common_1.NotFoundException('Negocio no encontrado');
        const oldStatus = business.status;
        const oldEnabled = business.isEnabled;
        business.status = newStatus;
        business.statusUpdatedAt = new Date();
        if (reasonCode)
            business.statusReasonCode = reasonCode;
        if (reasonText)
            business.statusReasonText = reasonText;
        if (newStatus === 'ARCHIVED') {
            business.isEnabled = false;
        }
        await this.businessRepository.save(business);
        if (oldStatus !== newStatus) {
            await this.auditService.log(audit_log_entity_1.AuditAction.BUSINESS_STATUS_CHANGED, 'BUSINESS', businessId, businessId, null, { oldStatus, newStatus, reasonCode, reasonText });
            if (newStatus === 'ARCHIVED') {
                await this.auditService.log(audit_log_entity_1.AuditAction.BUSINESS_ARCHIVED, 'BUSINESS', businessId, businessId, null, { reasonCode });
            }
        }
        if (oldEnabled !== business.isEnabled) {
            await this.auditService.log(audit_log_entity_1.AuditAction.BUSINESS_ENABLED_CHANGED, 'BUSINESS', businessId, businessId, null, { previousValue: oldEnabled, newValue: business.isEnabled, reasonCode, reasonText });
        }
        return { businessId, status: newStatus, isEnabled: business.isEnabled };
    }
    async updateEnabledAdmin(businessId, isEnabled, reasonCode, reasonText) {
        const business = await this.businessRepository.findOneBy({ id: businessId });
        if (!business)
            throw new common_1.NotFoundException('Negocio no encontrado');
        const previousValue = business.isEnabled;
        if (previousValue === isEnabled)
            return { businessId, isEnabled };
        business.isEnabled = isEnabled;
        business.statusUpdatedAt = new Date();
        if (reasonCode)
            business.statusReasonCode = reasonCode;
        if (reasonText)
            business.statusReasonText = reasonText;
        await this.businessRepository.save(business);
        await this.auditService.log(audit_log_entity_1.AuditAction.BUSINESS_ENABLED_CHANGED, 'BUSINESS', businessId, businessId, null, { previousValue, newValue: isEnabled, reasonCode, reasonText });
        return { businessId, isEnabled, status: business.status };
    }
    async getBusinessAuditLogs(businessId) {
        return this.auditService.findByBusiness(businessId);
    }
    async getBusinessUsage(businessId) {
        return this.planUsageService.getBusinessUsage(businessId);
    }
    async resolveBusinessConfig(userId, businessId) {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        if (!business)
            throw new common_1.ForbiddenException('Negocio no encontrado');
        const template = await this.templateRepository.findOneBy({ key: business.category });
        let config = JSON.parse(JSON.stringify(DEFAULT_BASE_CONFIG));
        if (template?.config) {
            config = {
                ...config,
                ...template.config,
                features: { ...config.features, ...(template.config.features || {}) }
            };
        }
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const subscriptionStatus = business?.subscription?.status || 'ACTIVE';
        const limits = plan_limits_config_1.PLAN_LIMITS[plan];
        if (config.features) {
            config.features.hasMaterials = limits.features.hasMaterials;
        }
        if (business.capabilitiesOverride) {
            config = { ...config, ...business.capabilitiesOverride };
        }
        const membership = await this.membershipRepository.findOneBy({ userId, businessId });
        const userRole = membership?.role || enums_1.BusinessRole.OPERATOR;
        const userPermissions = this.getPermissionsForRole(userRole);
        return {
            businessId: business.id,
            config,
            userRole,
            userPermissions,
            subscription: {
                plan,
                status: subscriptionStatus,
                currentPeriodEnd: business?.subscription?.currentPeriodEnd,
                trialEndAt: business?.subscription?.trialEndAt,
                cancelAtPeriodEnd: business?.subscription?.cancelAtPeriodEnd || false
            }
        };
    }
    getPermissionsForRole(role) {
        const matrix = {
            [enums_1.BusinessRole.OWNER]: {
                employees: { canRead: true, canManage: true },
                audit: { canRead: true, canManage: true },
                config_admin: { canRead: true, canManage: true },
                materials: { canRead: true, canManage: true },
                stockMoves: { canCreate: true },
                machines: { canRead: true, canManage: true, canUpdateStatus: true },
                payments: { canRead: true, canManage: true },
                orders: { canRead: true, canManage: true, canUpdateStatus: true, canReadFinancials: true },
            },
            [enums_1.BusinessRole.BUSINESS_ADMIN]: {
                employees: { canRead: true, canManage: true },
                audit: { canRead: true, canManage: false },
                config_admin: { canRead: true, canManage: false },
                materials: { canRead: true, canManage: true },
                stockMoves: { canCreate: true },
                machines: { canRead: true, canManage: true, canUpdateStatus: true },
                payments: { canRead: true, canManage: true },
                orders: { canRead: true, canManage: true, canUpdateStatus: true, canReadFinancials: true },
            },
            [enums_1.BusinessRole.SALES]: {
                employees: { canRead: true, canManage: false },
                audit: { canRead: false, canManage: false },
                config_admin: { canRead: false, canManage: false },
                materials: { canRead: true, canManage: false },
                stockMoves: { canCreate: false },
                machines: { canRead: true, canManage: false, canUpdateStatus: false },
                payments: { canRead: true, canManage: true },
                orders: { canRead: true, canManage: true, canUpdateStatus: true, canReadFinancials: true },
            },
            [enums_1.BusinessRole.OPERATOR]: {
                employees: { canRead: false, canManage: false },
                audit: { canRead: false, canManage: false },
                config_admin: { canRead: false, canManage: false },
                materials: { canRead: true, canManage: false },
                stockMoves: { canCreate: true },
                machines: { canRead: true, canManage: false, canUpdateStatus: true },
                payments: { canRead: false, canManage: false },
                orders: { canRead: true, canManage: false, canUpdateStatus: true, canReadFinancials: false },
            },
            [enums_1.BusinessRole.VIEWER]: {
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
        return matrix[role] || matrix[enums_1.BusinessRole.VIEWER];
    }
    async getDashboardSummary(userId, businessId) {
        const hasAccess = await this.checkAccess(userId, businessId);
        if (!hasAccess)
            throw new common_1.ForbiddenException('Sin acceso');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const ACTIVE_WORKING_STATUSES = [
            enums_2.OrderStatus.PENDING, enums_2.OrderStatus.IN_PROGRESS, enums_2.OrderStatus.CONFIRMED,
            enums_2.OrderStatus.READY, enums_2.OrderStatus.DONE, enums_2.OrderStatus.DESIGN,
            enums_2.OrderStatus.CUTTING, enums_2.OrderStatus.WELDING, enums_2.OrderStatus.ASSEMBLY,
            enums_2.OrderStatus.PAINTING, enums_2.OrderStatus.BARNIZADO, enums_2.OrderStatus.POST_PROCESS,
            enums_2.OrderStatus.REPRINT_PENDING, enums_2.OrderStatus.RE_WORK, enums_2.OrderStatus.IN_STOCK,
            enums_2.OrderStatus.SITE_VISIT, enums_2.OrderStatus.SITE_VISIT_DONE, enums_2.OrderStatus.VISITA_REPROGRAMADA,
            enums_2.OrderStatus.QUOTATION, enums_2.OrderStatus.BUDGET_GENERATED, enums_2.OrderStatus.SURVEY_DESIGN, enums_2.OrderStatus.APPROVED,
            enums_2.OrderStatus.OFFICIAL_ORDER, enums_2.OrderStatus.INSTALACION_OBRA
        ];
        const PRODUCTION_STATUSES = [
            enums_2.OrderStatus.IN_PROGRESS, enums_2.OrderStatus.DESIGN, enums_2.OrderStatus.CUTTING,
            enums_2.OrderStatus.WELDING, enums_2.OrderStatus.ASSEMBLY, enums_2.OrderStatus.PAINTING,
            enums_2.OrderStatus.BARNIZADO, enums_2.OrderStatus.POST_PROCESS, enums_2.OrderStatus.RE_WORK,
            enums_2.OrderStatus.OFFICIAL_ORDER
        ];
        const [salesResult, activeOrdersWithItems, activeMachinesCount, productionOrdersCount, newCustomersCount, recentOrders, realOverdue] = await Promise.all([
            this.orderRepository.createQueryBuilder('order')
                .select('SUM(order.totalPrice)', 'total')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status IN (:...statuses)', { statuses: [enums_2.OrderStatus.DELIVERED, enums_2.OrderStatus.DONE] })
                .getRawOne(),
            this.orderRepository.find({
                where: { businessId, status: (0, typeorm_2.In)(ACTIVE_WORKING_STATUSES) },
                relations: ['items', 'siteInfo']
            }),
            this.machineRepository.count({
                where: { businessId, status: enums_2.MachineStatus.PRINTING }
            }),
            this.orderRepository.count({
                where: { businessId, status: (0, typeorm_2.In)(PRODUCTION_STATUSES) }
            }),
            this.customerRepository.count({
                where: { businessId, createdAt: (0, typeorm_2.MoreThanOrEqual)(thirtyDaysAgo) }
            }),
            this.orderRepository.find({
                where: { businessId },
                order: { updatedAt: 'DESC' },
                take: 5
            }),
            this.orderRepository.createQueryBuilder('order')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status NOT IN (:...finalStatuses)', { finalStatuses: [enums_2.OrderStatus.DELIVERED, enums_2.OrderStatus.CANCELLED] })
                .andWhere('order.type != :stockType', { stockType: enums_2.OrderType.STOCK })
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
        const business = await this.businessRepository.findOneBy({ id: businessId });
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
        return {
            totalSales: Number(salesResult?.total) || 0,
            pendingBalance,
            activeOrders: activeOrdersWithItems.length,
            productionOrders: productionOrdersCount,
            activeMachines: activeMachinesCount,
            newCustomers: newCustomersCount,
            recentOrders: recentOrders.map(o => ({ id: o.id, clientName: o.clientName, total: Number(o.totalPrice), status: o.status, dueDate: o.dueDate, type: o.type })),
            alerts: [],
            trends: null,
            operationalCounters,
            pipelineSummary,
            calendarEvents
        };
    }
    async findOne(userId, id) {
        const hasAccess = await this.checkAccess(userId, id);
        if (!hasAccess)
            throw new common_1.ForbiddenException('Acceso denegado');
        const business = await this.businessRepository.findOneBy({ id });
        if (!business)
            throw new common_1.NotFoundException('No encontrado');
        return business;
    }
    async update(userId, id, updateDto) {
        await this.findOne(userId, id);
        await this.businessRepository.update(id, updateDto);
        return this.findOne(userId, id);
    }
    async findUserBusinesses(userId, filters) {
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
        return memberships.map(m => m.business);
    }
    async checkAccess(userId, businessId) {
        return (await this.membershipRepository.countBy({ userId, businessId })) > 0;
    }
    async addMemberToBusiness(userId, businessId, role) {
        let m = await this.membershipRepository.findOne({ where: { userId, businessId } });
        if (!m)
            m = this.membershipRepository.create({ userId, businessId, role: role });
        else
            m.role = role;
        return this.membershipRepository.save(m);
    }
};
exports.BusinessesService = BusinessesService;
exports.BusinessesService = BusinessesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(business_entity_1.Business)),
    __param(1, (0, typeorm_1.InjectRepository)(business_membership_entity_1.BusinessMembership)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(business_template_entity_1.BusinessTemplate)),
    __param(4, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(5, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(6, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __param(7, (0, typeorm_1.InjectRepository)(material_entity_1.Material)),
    __param(8, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        plan_usage_service_1.PlanUsageService,
        audit_service_1.AuditService,
        billing_service_1.BillingService,
        typeorm_2.DataSource,
        business_strategy_provider_1.BusinessStrategyProvider])
], BusinessesService);
//# sourceMappingURL=businesses.service.js.map