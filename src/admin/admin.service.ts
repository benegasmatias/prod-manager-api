import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, EntityManager } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';

import { GlobalRoleConfig } from './entities/global-role-config.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { BusinessInvitation, InvitationStatus } from '../businesses/entities/business-invitation.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class AdminService implements OnModuleInit {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(GlobalRoleConfig)
        private readonly roleConfigRepository: Repository<GlobalRoleConfig>,
        @InjectRepository(SubscriptionPlan)
        private readonly planRepository: Repository<SubscriptionPlan>,
        @InjectRepository(AdminAuditLog)
        private readonly auditLogRepository: Repository<AdminAuditLog>,
        @InjectRepository(BusinessInvitation)
        private readonly invitationRepository: Repository<BusinessInvitation>,
        @InjectRepository(BusinessTemplate)
        private readonly templateRepository: Repository<BusinessTemplate>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async onModuleInit() {
        // Seed default plans on startup
        await this.seedDefaultPlans();
    }

    private async logAction(operatorId: string, action: string, targetId: string, details?: any) {
        const log = this.auditLogRepository.create({
            operatorId,
            action,
            targetId,
            details,
        });
        await this.auditLogRepository.save(log);
    }

    // Plans CRUD

    async seedDefaultPlans() {
        const defaults: CreatePlanDto[] = [
            {
                id: 'free-3d',
                name: 'FREE POR SIEMPRE',
                category: 'IMPRESION_3D',
                price: 0,
                currency: 'ARS',
                description: 'Ideal para hobbistas y makers solitarios.',
                features: ['30 pedidos / mes', '1 impresora', 'Solo propietario (1 usuario)', 'Smart Dashboard', 'Gestion de clientes', 'Reportes basicos'],
                sidebarItems: [
                    '/dashboard', '/pedidos', '/clientes',
                    '/produccion', '/stock', '/maquinas', '/materiales', '/ajustes'
                ],
                maxUsers: 1,
                maxOrdersPerMonth: 30,
                maxBusinesses: 1,
                maxMachines: 1,
                isRecommended: false,
                ctaText: 'Comenzar gratis',
                ctaLink: '/register',
                sortOrder: 0,
                active: true,
                hasTrial: false,
                trialDays: 0,
            },
            {
                id: 'pro-3d',
                name: 'TALLER INICIAL',
                category: 'IMPRESION_3D',
                price: 12000,
                promoPrice: 7000,
                promoDurationMonths: 6,
                promoLabel: 'OFERTA LANZAMIENTO',
                currency: 'ARS',
                description: 'Para pequeños talleres que empiezan a crecer.',
                features: ['60 pedidos / mes', '2 impresoras', '2 usuarios', 'Full Dashboard', 'Gestion de clientes', 'Control de materiales', 'Soporte prioritario'],
                sidebarItems: [
                    '/dashboard', '/calculadora', '/pedidos', '/clientes',
                    '/produccion', '/produccion/calendario', '/stock',
                    '/maquinas', '/materiales', '/personal', '/reportes', '/ajustes'
                ],
                maxUsers: 2,
                maxOrdersPerMonth: 60,
                maxBusinesses: 1,
                maxMachines: 2,
                isRecommended: true,
                ctaText: 'Mejorar ahora',
                ctaLink: '/register',
                sortOrder: 1,
                active: true,
                hasTrial: true,
                trialDays: 14,
            },
            {
                id: 'business-3d',
                name: 'GRANJA PRODUCCION',
                category: 'IMPRESION_3D',
                price: 34500,
                promoPrice: 20000,
                promoDurationMonths: 6,
                promoLabel: 'OFERTA LANZAMIENTO',
                currency: 'ARS',
                description: 'Para granjas con alto volumen de produccion.',
                features: ['120 pedidos', '5 impresoras', '5 usuarios', 'Full Dashboard', 'Reportes avanzados', 'Control de materiales', 'Soporte prioritario'],
                maxUsers: 5,
                maxOrdersPerMonth: 120,
                maxBusinesses: 1,
                maxMachines: 5,
                isRecommended: false,
                ctaText: 'Mejorar ahora',
                ctaLink: '/register',
                sortOrder: 2,
                active: true,
                hasTrial: true,
                trialDays: 7,
                metadata: {
                    gestionMateriales: 'Avanzada',
                    trazabilidadFallas: true,
                    reportesEficiencia: true,
                    apiWebhooks: true,
                    soporte: 'Dedicado'
                }
            }
        ];

        for (const planData of defaults) {
            try {
                const existing = await this.planRepository.findOneBy({ id: planData.id });
                if (!existing) {
                    await this.planRepository.save(this.planRepository.create(planData));
                    console.log(`[SEED] Created new plan: ${planData.id}`);
                }
                // No overwriting existing plans to preserve manual edits
            } catch (err) {
                console.error(`[SEED] Error in plan ${planData.id}:`, err.message);
            }
        }
        console.log('Default subscription plans initialization finished (Idempotent)');
    }

    async findAllPlans(category?: string): Promise<SubscriptionPlan[]> {
        return this.planRepository.find({
            where: category ? [{ category }, { category: IsNull() }] : {},
            order: { sortOrder: 'ASC' }
        });
    }

    async findActivePlans(category?: string): Promise<SubscriptionPlan[]> {
        return this.planRepository.find({
            where: category ? [
                { active: true, category },
                { active: true, category: IsNull() }
            ] : { active: true },
            order: { sortOrder: 'ASC' },
        });
    }

    async findPlanById(id: string): Promise<SubscriptionPlan> {
        const plan = await this.planRepository.findOneBy({ id });
        if (!plan) throw new NotFoundException('Plan no encontrado');
        return plan;
    }

    async createPlan(dto: CreatePlanDto): Promise<SubscriptionPlan> {
        const plan = this.planRepository.create(dto);
        return this.planRepository.save(plan);
    }

    async updatePlan(id: string, dto: UpdatePlanDto): Promise<SubscriptionPlan> {
        await this.planRepository.update(id, dto);
        return this.findPlanById(id);
    }

    async deletePlan(id: string): Promise<void> {
        const plan = await this.findPlanById(id);
        await this.planRepository.remove(plan);
    }

    async findAllRoleConfigs(): Promise<GlobalRoleConfig[]> {
        return this.roleConfigRepository.find();
    }

    async updateRoleConfig(role: string, data: Partial<GlobalRoleConfig>): Promise<GlobalRoleConfig> {
        await this.roleConfigRepository.update(role, data);
        return this.roleConfigRepository.findOneBy({ role }) as Promise<GlobalRoleConfig>;
    }

    async sendNotification(data: Partial<Notification>): Promise<Notification> {
        return this.notificationsService.create(data);
    }

    async findAllBusinesses(): Promise<any[]> {
        const businesses = await this.businessRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['memberships'],
        });

        const orderRepo = this.dataSource.getRepository('Order');
        const materialRepo = this.dataSource.getRepository('Material');

        return await Promise.all(businesses.map(async b => {
            const [orderCount, materialCount] = await Promise.all([
                orderRepo.countBy({ businessId: b.id }),
                materialRepo.countBy({ businessId: b.id })
            ]);

            return {
                ...b,
                stats: {
                    totalOrders: orderCount,
                    totalMaterials: materialCount
                }
            };
        }));
    }

    async findBusinessById(id: string): Promise<Business> {
        const business = await this.businessRepository.findOne({
            where: { id },
            relations: ['memberships'],
        });
        if (!business) throw new NotFoundException('Negocio no encontrado');
        return business;
    }

    async updateBusinessStatus(id: string, status: string, adminId: string): Promise<Business> {
        await this.businessRepository.update(id, { status });
        await this.logAction(adminId, 'BUSINESS_STATUS_UPDATE', id, { status });
        return this.findBusinessById(id);
    }

    async updateBusinessSubscription(id: string, planId: string, expiresAt: Date, adminId: string): Promise<Business> {
        await this.businessRepository.update(id, {
            planId,
            subscriptionExpiresAt: expiresAt,
            status: 'ACTIVE'
        });

        const subRepo = this.dataSource.getRepository('BusinessSubscription');
        await subRepo.upsert({
            businessId: id,
            plan: planId,
            status: 'ACTIVE',
            currentPeriodEnd: expiresAt,
            trialEndAt: null
        }, ['businessId']);

        await this.logAction(adminId, 'BUSINESS_SUBSCRIPTION_UPDATE', id, { planId, expiresAt });
        return this.findBusinessById(id);
    }

    async updateBusinessCapabilities(id: string, capabilities: string[], adminId: string): Promise<Business> {
        await this.businessRepository.update(id, { capabilities });
        await this.logAction(adminId, 'BUSINESS_CAPABILITIES_UPDATE', id, { capabilities });
        return this.findBusinessById(id);
    }

    async registerPayment(id: string, months: number, adminId: string): Promise<Business> {
        const business = await this.findBusinessById(id);
        const currentExpires = business.subscriptionExpiresAt || new Date();
        const newExpires = new Date(currentExpires);
        newExpires.setMonth(newExpires.getMonth() + months);

        await this.businessRepository.update(id, {
            subscriptionExpiresAt: newExpires,
            status: 'ACTIVE'
        });

        const subRepo = this.dataSource.getRepository('BusinessSubscription');
        await subRepo.upsert({
            businessId: id,
            status: 'ACTIVE',
            currentPeriodEnd: newExpires,
            gracePeriodEndAt: null
        }, ['businessId']);

        await this.logAction(adminId, 'BUSINESS_PAYMENT_REGISTERED', id, { months, newExpires });
        return this.findBusinessById(id);
    }

    async findAllUsers(
        page: number = 1,
        limit: number = 10,
        filters?: { search?: string, status?: string, plan?: string }
    ): Promise<{ items: User[], meta: any }> {
        const query = this.userRepository.createQueryBuilder('user');

        if (filters?.search) {
            query.andWhere('(user.email ILIKE :search OR user.fullName ILIKE :search)', { search: `%${filters.search}%` });
        }

        if (filters?.status) {
            query.andWhere('user.status = :status', { status: filters.status });
        }

        if (filters?.plan) {
            query.andWhere('user.plan = :plan', { plan: filters.plan });
        }

        query.orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [items, totalItems] = await query.getManyAndCount();

        return {
            items,
            meta: {
                totalItems,
                itemCount: items.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            },
        };
    }

    async findUserById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['memberships', 'memberships.business'],
        });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async getUserAuditLogs(targetId: string): Promise<AdminAuditLog[]> {
        return this.auditLogRepository.find({
            where: { targetId },
            order: { timestamp: 'DESC' }
        });
    }

    async approveUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, {
            status: 'ACTIVE',
            active: true
        });
        await this.logAction(adminId, 'USER_APPROVED', id);
        return this.findUserById(id);
    }

    async blockUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { status: 'BLOCKED', active: false });
        await this.logAction(adminId, 'USER_BLOCKED', id);
        return this.findUserById(id);
    }

    async unblockUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { status: 'ACTIVE', active: true });
        await this.logAction(adminId, 'USER_UNBLOCKED', id);
        return this.findUserById(id);
    }

    async suspendUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { status: 'SUSPENDED', active: false });
        await this.logAction(adminId, 'USER_SUSPENDED', id);
        return this.findUserById(id);
    }

    async reactivateUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { status: 'ACTIVE', active: true });
        await this.logAction(adminId, 'USER_REACTIVATED', id);
        return this.findUserById(id);
    }

    async softDeleteUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { status: 'DELETED', active: false });
        await this.logAction(adminId, 'USER_DELETED', id);
        return this.findUserById(id);
    }

    async updateUser(id: string, data: any, adminId: string): Promise<User> {
        await this.userRepository.update(id, data);
        await this.logAction(adminId, 'USER_UPDATED', id, data);
        return this.findUserById(id);
    }

    async updateUserGlobalRole(id: string, role: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { globalRole: role });
        await this.logAction(adminId, 'USER_ROLE_UPDATED', id, { role });
        return this.findUserById(id);
    }

    async resendInvitation(id: string, adminId: string): Promise<any> {
        await this.logAction(adminId, 'INVITATION_RESENT', id);
        return { success: true };
    }

    async cancelInvitation(id: string, adminId: string): Promise<any> {
        await this.invitationRepository.update(id, { status: InvitationStatus.CANCELLED });
        await this.logAction(adminId, 'INVITATION_CANCELLED', id);
        return { success: true };
    }

    async findAllInvitations(
        page: number = 1,
        limit: number = 10,
        filters?: { search?: string, status?: string }
    ): Promise<{ items: BusinessInvitation[], meta: any }> {
        const query = this.invitationRepository.createQueryBuilder('invitation');
        const [items, totalItems] = await query.getManyAndCount();
        return {
            items,
            meta: {
                totalItems,
                itemCount: items.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
            },
        };
    }

    async bootstrapAdmin(userId: string): Promise<User> {
        await this.userRepository.update(userId, { globalRole: 'SUPER_ADMIN' });
        return this.findUserById(userId);
    }

    async auditCapabilitiesAlignment(): Promise<any[]> {
        const businesses = await this.businessRepository.find();
        const templates = await this.templateRepository.find();
        const templateMap = new Map(templates.map(t => [t.key, t]));

        const results = [];
        for (const b of businesses) {
            const audit = await this.calculateAlignment(b, templateMap.get(b.category));
            if (audit.missing.length > 0) {
                results.push({
                    businessId: b.id,
                    name: b.name,
                    category: b.category,
                    current: audit.current,
                    expected: audit.expected,
                    missing: audit.missing
                });
            }
        }
        return results;
    }

    async repairCapabilitiesAlignment(options: { businessIds?: string[], dryRun?: boolean }, adminId: string): Promise<any> {
        const query = this.businessRepository.createQueryBuilder('business');
        if (options.businessIds && options.businessIds.length > 0) {
            query.where('business.id IN (:...ids)', { ids: options.businessIds });
        }

        const businesses = await query.getMany();
        const templates = await this.templateRepository.find();
        const templateMap = new Map(templates.map(t => [t.key, t]));

        const repairs = [];
        for (const b of businesses) {
            const audit = await this.calculateAlignment(b, templateMap.get(b.category));
            if (audit.missing.length > 0) {
                const updatedCaps = Array.from(new Set([...audit.current, ...audit.missing]));

                if (!options.dryRun) {
                    b.capabilities = updatedCaps;
                    await this.businessRepository.save(b);
                    await this.logAction(adminId, 'CAPABILITIES_REPAIRED', b.id, {
                        added: audit.missing,
                        newTotal: updatedCaps.length
                    });
                }

                repairs.push({
                    businessId: b.id,
                    name: b.name,
                    added: audit.missing,
                    status: options.dryRun ? 'DRY_RUN_PENDING' : 'REPAIRED'
                });
            }
        }

        return {
            processed: businesses.length,
            repairsCount: repairs.length,
            repairs,
            dryRun: !!options.dryRun
        };
    }

    async initializeCapabilitiesForNewBusiness(business: Business, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Business) : this.businessRepository;
        const templates = await this.templateRepository.find();
        const template = templates.find(t => t.key === business.category);

        const audit = await this.calculateAlignment(business, template);
        if (audit.expected.length > 0) {
            business.capabilities = audit.expected;
            await repo.save(business);
            await this.logAction('SYSTEM', 'CAPABILITIES_INITIALIZED', business.id, {
                capabilities: audit.expected
            });
        }
    }

    private async calculateAlignment(business: Business, template?: BusinessTemplate) {
        const actual = business.capabilities || [];
        const systemDefaults = ['SALES_BASIC'];
        const templateCaps = template?.defaultCapabilities || [];
        const overrides = Array.isArray(business.capabilitiesOverride) ? business.capabilitiesOverride : [];

        const expected = Array.from(new Set([
            ...systemDefaults,
            ...templateCaps,
            ...overrides
        ]));

        const missing = expected.filter(cap => !actual.includes(cap));

        return { current: actual, expected, missing };
    }

    async findAllTemplates(): Promise<BusinessTemplate[]> {
        return this.templateRepository.find({ order: { name: 'ASC' } });
    }

    async updateTemplate(key: string, data: Partial<BusinessTemplate>): Promise<BusinessTemplate> {
        const template = await this.templateRepository.findOneBy({ key: key as any });
        if (!template) throw new NotFoundException('Template no encontrado');

        Object.assign(template, data);
        return this.templateRepository.save(template);
    }

    async createTemplate(data: Partial<BusinessTemplate>): Promise<BusinessTemplate> {
        const template = this.templateRepository.create(data);
        return this.templateRepository.save(template);
    }

    async seedAllTemplates(): Promise<any> {
        const repo = this.dataSource.getRepository(BusinessTemplate);
        const templatesToSeed = [
            {
                key: 'IMPRESION_3D',
                name: 'Impresion 3D',
                description: 'Gestion de granjas de impresion, filamentos y servicios de diseño STL.',
                imageKey: '3d-printing-template',
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'PRODUCTION_MACHINES', 'INVENTORY_RAW', 'SALES_MANAGEMENT']
            }
        ];

        for (const t of templatesToSeed) {
            let temp = await repo.findOneBy({ key: t.key as any });
            if (!temp) {
                temp = repo.create({ ...t, key: t.key as any });
            } else {
                temp.defaultCapabilities = t.defaultCapabilities;
            }
            await repo.save(temp);
        }

        return { message: 'Templates synchronized' };
    }

    async getPlatformStats(): Promise<any> {
        return { users: 0, businesses: 0 };
    }

    async getMetadata() {
        const roles = await this.roleConfigRepository.find();

        return {
            userStatuses: ['PENDING', 'ACTIVE', 'BLOCKED', 'SUSPENDED', 'DELETED'],
            invitationStatuses: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
            businessStatuses: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'],
            globalRoles: roles.map(r => ({ id: r.role, label: r.role.replace('_', ' ') })),
            plans: await this.planRepository.find({ select: ['id', 'name'] })
        };
    }
    async seedDebugOrders(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user || !user.defaultBusinessId) {
            throw new NotFoundException('Usuario o negocio por defecto no encontrado');
        }

        const businessId = user.defaultBusinessId;

        // Usamos transaccion para asegurar integridad
        return await this.dataSource.transaction(async (manager) => {
            const Order = (await import('../orders/entities/order.entity')).Order;
            const OrderItem = (await import('../orders/entities/order-item.entity')).OrderItem;
            const OrderStatus = (await import('../common/enums')).OrderStatus;
            const OrderType = (await import('../common/enums')).OrderType;

            const ordersData = [
                {
                    clientName: 'Coleccionables San Juan',
                    notes: 'Impresión en resina o PLA de alta calidad. Acabado mate.',
                    items: [
                        { name: 'Busto Batman 1:4 - Detalle Ultra', qty: 1, price: 15000, weightGrams: 450, estimatedMinutes: 1200 }
                    ],
                    status: OrderStatus.IN_PROGRESS,
                    priority: 2,
                    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                },
                {
                    clientName: 'Industrias RB',
                    notes: 'Repuestos mecánicos. Requiere 100% relleno.',
                    items: [
                        { name: 'Engranaje Helicoidal Z24 - Nylon CF', qty: 10, price: 2500, weightGrams: 45, estimatedMinutes: 180 }
                    ],
                    status: OrderStatus.PENDING,
                    priority: 1,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                },
                {
                    clientName: 'Decoración Natural',
                    notes: 'Serie de macetas para local comercial.',
                    items: [
                        { name: 'Maceta Autorregable Octo - PLA Wood', qty: 5, price: 4200, weightGrams: 180, estimatedMinutes: 360 }
                    ],
                    status: OrderStatus.DONE,
                    priority: 3,
                    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                }
            ];

            const createdOrders = [];

            for (const data of ordersData) {
                const { items, ...orderInfo } = data;

                const order = manager.create(Order, {
                    ...orderInfo,
                    businessId,
                    type: OrderType.CUSTOM,
                    totalPrice: items.reduce((acc, i) => acc + (i.price * i.qty), 0),
                    totalSenias: 0
                });

                const savedOrder = await manager.save(Order, order);

                for (const itemData of items) {
                    const item = manager.create(OrderItem, {
                        ...itemData,
                        orderId: savedOrder.id,
                        businessId
                    });
                    await manager.save(OrderItem, item);
                }
                createdOrders.push(savedOrder);
            }

            return { message: 'Seed de ejemplos completado', count: createdOrders.length };
        });
    }
}
