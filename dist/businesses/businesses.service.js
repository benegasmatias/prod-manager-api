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
const user_entity_1 = require("../users/entities/user.entity");
const business_template_entity_1 = require("./entities/business-template.entity");
const typeorm_3 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const machine_entity_1 = require("../machines/entities/machine.entity");
const enums_1 = require("../common/enums");
const material_entity_1 = require("../materials/entities/material.entity");
const employee_entity_1 = require("../employees/entities/employee.entity");
let BusinessesService = class BusinessesService {
    constructor(businessRepository, membershipRepository, userRepository, templateRepository, orderRepository, customerRepository, machineRepository, materialRepository, dataSource) {
        this.businessRepository = businessRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.templateRepository = templateRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.machineRepository = machineRepository;
        this.materialRepository = materialRepository;
        this.dataSource = dataSource;
    }
    async getTemplates() {
        const templates = await this.templateRepository.find();
        return templates.map(t => ({
            key: t.key,
            name: t.name,
            description: t.description,
            imageKey: t.imageKey,
        }));
    }
    async createFromTemplate(userId, createDto) {
        const { templateKey, name } = createDto;
        const template = await this.templateRepository.findOneBy({ key: templateKey });
        if (!template && templateKey !== 'GENERICO') {
            throw new common_1.NotFoundException(`Template with key ${templateKey} not found`);
        }
        return await this.dataSource.transaction(async (manager) => {
            const existingMembership = await manager.findOne(business_membership_entity_1.BusinessMembership, {
                where: {
                    userId,
                    business: { category: templateKey }
                },
                relations: ['business']
            });
            if (existingMembership) {
                throw new common_1.BadRequestException(`Ya tienes un negocio registrado en el rubro ${templateKey}. No se permiten duplicados por rubro.`);
            }
            console.log(`[Onboarding] Creating new business for user ${userId} [Category: ${templateKey}]`);
            const business = manager.create(business_entity_1.Business, {
                name: name || (template ? `${template.name} - Mi Espacio` : 'Mi Negocio'),
                category: templateKey
            });
            const businessToUse = await manager.save(business_entity_1.Business, business);
            const membership = manager.create(business_membership_entity_1.BusinessMembership, {
                userId,
                businessId: businessToUse.id,
                role: business_membership_entity_1.UserRole.OWNER
            });
            await manager.save(business_membership_entity_1.BusinessMembership, membership);
            const user = await manager.findOneBy(user_entity_1.User, { id: userId });
            if (user) {
                const existingEmployee = await manager.findOne(employee_entity_1.Employee, {
                    where: { businessId: businessToUse.id, email: user.email }
                });
                if (!existingEmployee) {
                    const nameParts = (user.fullName || 'Propietario').trim().split(/\s+/);
                    const firstName = nameParts[0] || 'Propietario';
                    const lastName = nameParts.slice(1).join(' ');
                    const employee = manager.create(employee_entity_1.Employee, {
                        businessId: businessToUse.id,
                        firstName: firstName,
                        lastName: lastName,
                        email: user.email,
                        active: true,
                        specialties: 'Administrador / Dueño'
                    });
                    await manager.save(employee_entity_1.Employee, employee);
                    console.log(`✅ [Onboarding] Owner ${user.email} added as first Employee for business ${businessToUse.id}`);
                }
            }
            if (user && !user.defaultBusinessId) {
                user.defaultBusinessId = businessToUse.id;
                await manager.save(user_entity_1.User, user);
                console.log(`✅ [Onboarding] defaultBusinessId seteado (primera vez) -> ${businessToUse.id}`);
            }
            return {
                business: {
                    id: businessToUse.id,
                    name: businessToUse.name,
                    category: businessToUse.category
                },
                defaultBusinessId: businessToUse.id
            };
        });
    }
    async checkAccess(userId, businessId) {
        const membership = await this.membershipRepository.findOne({
            where: { userId, businessId }
        });
        return !!membership;
    }
    async findUserBusinesses(userId) {
        const memberships = await this.membershipRepository.find({
            where: { userId },
            relations: ['business']
        });
        return memberships.map(m => m.business);
    }
    async getDashboardSummary(userId, businessId) {
        const hasAccess = await this.checkAccess(userId, businessId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('No tienes acceso a este negocio');
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const ACTIVE_WORKING_STATUSES = [
            enums_1.OrderStatus.PENDING, enums_1.OrderStatus.IN_PROGRESS, enums_1.OrderStatus.CONFIRMED,
            enums_1.OrderStatus.READY, enums_1.OrderStatus.DONE, enums_1.OrderStatus.DESIGN,
            enums_1.OrderStatus.CUTTING, enums_1.OrderStatus.WELDING, enums_1.OrderStatus.ASSEMBLY,
            enums_1.OrderStatus.PAINTING, enums_1.OrderStatus.BARNIZADO, enums_1.OrderStatus.POST_PROCESS,
            enums_1.OrderStatus.REPRINT_PENDING, enums_1.OrderStatus.RE_WORK, enums_1.OrderStatus.IN_STOCK,
            enums_1.OrderStatus.SITE_VISIT, enums_1.OrderStatus.SITE_VISIT_DONE, enums_1.OrderStatus.VISITA_REPROGRAMADA,
            enums_1.OrderStatus.QUOTATION, enums_1.OrderStatus.BUDGET_GENERATED, enums_1.OrderStatus.SURVEY_DESIGN, enums_1.OrderStatus.APPROVED,
            enums_1.OrderStatus.OFFICIAL_ORDER, enums_1.OrderStatus.INSTALACION_OBRA
        ];
        const PRODUCTION_STATUSES = [
            enums_1.OrderStatus.IN_PROGRESS, enums_1.OrderStatus.DESIGN, enums_1.OrderStatus.CUTTING,
            enums_1.OrderStatus.WELDING, enums_1.OrderStatus.ASSEMBLY, enums_1.OrderStatus.PAINTING,
            enums_1.OrderStatus.BARNIZADO, enums_1.OrderStatus.POST_PROCESS, enums_1.OrderStatus.RE_WORK,
            enums_1.OrderStatus.OFFICIAL_ORDER
        ];
        const [salesResult, activeOrdersWithItems, activeMachinesCount, productionOrdersCount, newCustomersCount, recentOrders, realOverdue] = await Promise.all([
            this.orderRepository.createQueryBuilder('order')
                .select('SUM(order.totalPrice)', 'total')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status IN (:...statuses)', { statuses: [enums_1.OrderStatus.DELIVERED, enums_1.OrderStatus.DONE] })
                .getRawOne(),
            this.orderRepository.find({
                where: { businessId, status: (0, typeorm_3.In)(ACTIVE_WORKING_STATUSES) },
                relations: ['items']
            }),
            this.machineRepository.count({
                where: { businessId, status: enums_1.MachineStatus.PRINTING }
            }),
            this.orderRepository.count({
                where: { businessId, status: (0, typeorm_3.In)(PRODUCTION_STATUSES) }
            }),
            this.customerRepository.count({
                where: { businessId, createdAt: (0, typeorm_3.MoreThanOrEqual)(thirtyDaysAgo) }
            }),
            this.orderRepository.find({
                where: { businessId },
                order: { updatedAt: 'DESC' },
                take: 5
            }),
            this.orderRepository.createQueryBuilder('order')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status NOT IN (:...finalStatuses)', { finalStatuses: [enums_1.OrderStatus.DELIVERED, enums_1.OrderStatus.CANCELLED] })
                .andWhere('order.type != :stockType', { stockType: enums_1.OrderType.STOCK })
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
        const rawCategory = business?.category?.toUpperCase().trim() || 'GENERICO';
        const hasMetalStatuses = activeOrdersWithItems.some(o => [enums_1.OrderStatus.SITE_VISIT, enums_1.OrderStatus.SITE_VISIT_DONE, enums_1.OrderStatus.OFFICIAL_ORDER, enums_1.OrderStatus.WELDING, enums_1.OrderStatus.CUTTING, enums_1.OrderStatus.QUOTATION, enums_1.OrderStatus.BUDGET_GENERATED]
            .includes(o.status));
        const isMetalurgica = rawCategory.includes('METAL') || rawCategory.includes('HIERRO') || rawCategory === 'METALURGICA' || hasMetalStatuses;
        const isCarpinteria = rawCategory.includes('CARP') || rawCategory.includes('MADERA') || rawCategory === 'CARPINTERIA';
        console.log(`[Dashboard] Category: ${rawCategory} | Metal(heur): ${hasMetalStatuses} | FINAL: isMetal=${isMetalurgica}`);
        let operationalCounters = undefined;
        let pipelineSummary = undefined;
        let calendarEvents = undefined;
        if (isMetalurgica || isCarpinteria) {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);
            operationalCounters = {
                visitsToday: activeOrdersWithItems.filter(o => (o.status === enums_1.OrderStatus.SITE_VISIT || o.status === enums_1.OrderStatus.SITE_VISIT_DONE) && o.fecha_visita === todayStr).length,
                pendingBudgets: activeOrdersWithItems.filter(o => o.status === enums_1.OrderStatus.QUOTATION || o.status === enums_1.OrderStatus.SURVEY_DESIGN || o.status === enums_1.OrderStatus.BUDGET_GENERATED).length,
                inProduction: activeOrdersWithItems.filter(o => PRODUCTION_STATUSES.includes(o.status)).length,
                deliveriesThisWeek: activeOrdersWithItems.filter(o => o.dueDate && o.dueDate <= nextWeek && o.status !== enums_1.OrderStatus.DONE).length,
                delayedOrders: realOverdue.length,
                pendingPayments: activeOrdersWithItems.filter(o => {
                    const total = Number(o.totalPrice) || 0;
                    const dep = o.items?.reduce((a, i) => a + Number(i.deposit || 0), 0) || 0;
                    const pay = o.payments?.reduce((a, p) => a + Number(p.amount || 0), 0) || 0;
                    return (total - dep - pay) > 0;
                }).length
            };
            const pipelineStages = [
                { stage: 'VISITA', statuses: [enums_1.OrderStatus.SITE_VISIT, enums_1.OrderStatus.VISITA_REPROGRAMADA, enums_1.OrderStatus.SITE_VISIT_DONE] },
                { stage: 'PRESUPUESTO', statuses: [enums_1.OrderStatus.QUOTATION, enums_1.OrderStatus.BUDGET_GENERATED, enums_1.OrderStatus.SURVEY_DESIGN] },
                { stage: 'APROBADO', statuses: [enums_1.OrderStatus.APPROVED, enums_1.OrderStatus.OFFICIAL_ORDER] },
                { stage: 'PRODUCCION', statuses: PRODUCTION_STATUSES },
                { stage: 'LISTO', statuses: [enums_1.OrderStatus.DONE, enums_1.OrderStatus.READY] },
                { stage: 'ENTREGADO', statuses: [enums_1.OrderStatus.DELIVERED] }
            ];
            pipelineSummary = pipelineStages.map(s => ({
                stage: s.stage,
                count: activeOrdersWithItems.filter(o => s.statuses.includes(o.status)).length
            }));
            calendarEvents = activeOrdersWithItems
                .filter(o => ((o.status === enums_1.OrderStatus.SITE_VISIT || o.status === enums_1.OrderStatus.SITE_VISIT_DONE) && o.fecha_visita) ||
                (o.dueDate && [enums_1.OrderStatus.DONE, enums_1.OrderStatus.READY, enums_1.OrderStatus.INSTALACION_OBRA].includes(o.status)))
                .sort((a, b) => {
                const dateA = a.fecha_visita || a.dueDate?.toISOString().split('T')[0] || '';
                const dateB = b.fecha_visita || b.dueDate?.toISOString().split('T')[0] || '';
                return dateA.localeCompare(dateB);
            })
                .slice(0, 10)
                .map(o => ({
                id: o.id,
                type: (o.status === enums_1.OrderStatus.SITE_VISIT || o.status === enums_1.OrderStatus.SITE_VISIT_DONE) ? 'VISIT' : 'DELIVERY',
                clientName: o.clientName || 'Cliente',
                date: o.fecha_visita || (o.dueDate ? o.dueDate.toISOString().split('T')[0] : ''),
                time: o.hora_visita,
                status: o.status
            }));
        }
        const mergedAlerts = [
            ...realOverdue.map(o => ({
                type: 'vencido',
                message: `Pedido ${o.code || o.id.slice(0, 8)} está vencido`,
                metadata: { orderId: o.id }
            })),
        ];
        const CRITICAL_STOCK_UMBRAL = 200;
        const lowStockMaterials = await this.materialRepository.find({
            where: {
                businessId,
                active: true,
                remainingWeightGrams: (0, typeorm_3.MoreThanOrEqual)(0)
            }
        });
        const criticalMaterials = lowStockMaterials.filter(m => m.remainingWeightGrams < CRITICAL_STOCK_UMBRAL);
        mergedAlerts.push(...criticalMaterials.map(m => ({
            type: 'stock_bajo',
            message: `${m.name} (${m.type}) tiene bajo stock: ${m.remainingWeightGrams.toFixed(0)}g restantes.`,
            metadata: { materialId: m.id }
        })));
        return {
            totalSales: Number(salesResult?.total) || 0,
            pendingBalance,
            activeOrders: activeOrdersWithItems.length,
            productionOrders: productionOrdersCount,
            activeMachines: activeMachinesCount,
            newCustomers: newCustomersCount,
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                clientName: o.clientName || 'Sin Nombre',
                total: Number(o.totalPrice),
                status: o.status,
                dueDate: o.dueDate,
                type: o.type
            })),
            alerts: mergedAlerts,
            trends: null,
            operationalCounters,
            pipelineSummary,
            calendarEvents
        };
    }
    async findOne(userId, id) {
        const hasAccess = await this.checkAccess(userId, id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('No tienes acceso a este negocio');
        }
        const business = await this.businessRepository.findOneBy({ id });
        if (!business) {
            throw new common_1.NotFoundException('Negocio no encontrado');
        }
        return business;
    }
    async update(userId, id, updateDto) {
        const hasAccess = await this.checkAccess(userId, id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('No tienes acceso a este negocio');
        }
        await this.businessRepository.update(id, updateDto);
        return this.findOne(userId, id);
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_3.DataSource])
], BusinessesService);
//# sourceMappingURL=businesses.service.js.map