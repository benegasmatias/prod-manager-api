import { Injectable, NotFoundException, ForbiddenException, OnModuleInit, ConflictException, BadRequestException } from '@nestjs/common';
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
import { SupabaseService } from '../common/supabase/supabase.service';
import { PlatformConfig } from './entities/platform-config.entity';

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
        @InjectRepository(PlatformConfig)
        private readonly configRepository: Repository<PlatformConfig>,
        @InjectRepository(BusinessInvitation)
        private readonly invitationRepository: Repository<BusinessInvitation>,
        @InjectRepository(BusinessTemplate)
        private readonly templateRepository: Repository<BusinessTemplate>,
        private readonly notificationsService: NotificationsService,
        private readonly supabaseService: SupabaseService,
    ) { }

    async onModuleInit() {
        // Seed default plans and templates on startup
        await this.seedDefaultPlans();
        await this.seedAllTemplates();
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

    // --- Platform Configuration ---

    async getPlatformConfig(): Promise<PlatformConfig> {
        let config = await this.configRepository.findOne({ where: { id: 1 } });
        if (!config) {
            config = this.configRepository.create({
                id: 1,
                allowTemporaryEmails: false,
                blockedDomains: [
                    'mailinator.com', 'yopmail.com', 'guerrillamail.com',
                    '10minutemail.com', 'temp-mail.org', 'dispostable.com',
                    'getnada.com', 'boun.cr', 'sharklasers.com'
                ]
            });
            await this.configRepository.save(config);
        }
        return config;
    }

    async updatePlatformConfig(data: Partial<PlatformConfig>, adminId: string): Promise<PlatformConfig> {
        const config = await this.getPlatformConfig();
        Object.assign(config, data);
        const updated = await this.configRepository.save(config);
        await this.logAction(adminId, 'PLATFORM_CONFIG_UPDATED', '1', data);
        return updated;
    }

    private isEmailDisposable(email: string, blockedDomains: string[]): boolean {
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return false;
        return (blockedDomains || []).includes(domain);
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
                features: ['10 pedidos / mes', '1 impresora', 'Solo propietario (1 usuario)', 'Smart Dashboard', 'Gestion de clientes'],
                sidebarItems: [
                    '/dashboard', '/pedidos', '/clientes',
                    '/produccion', '/stock', '/maquinas', '/materiales', '/ajustes'
                ],
                maxUsers: 1,
                maxOrdersPerMonth: 10,
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
                price: 19900,
                promoPrice: 7900,
                promoDurationMonths: 6,
                promoLabel: 'OFERTA LANZAMIENTO',
                currency: 'ARS',
                description: 'Para pequeños talleres que empiezan a crecer.',
                features: ['60 pedidos / mes', '2 impresoras', '2 usuarios', 'Full Dashboard', 'Gestion de clientes', 'Control de materiales', 'Soporte prioritario', 'Calendario', 'Catálogo Online'],
                sidebarItems: [
                    '/dashboard', '/calculadora', '/pedidos', '/clientes', '/catalogo',
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
                price: 39900,
                promoPrice: 15900,
                promoDurationMonths: 6,
                promoLabel: 'OFERTA LANZAMIENTO',
                currency: 'ARS',
                description: 'Para granjas con alto volumen de produccion.',
                features: ['120 pedidos', '5 impresoras', '5 usuarios', 'Full Dashboard', 'Reportes avanzados', 'Control de materiales', 'Soporte prioritario', 'Calendario', 'Catálogo Online'],
                sidebarItems: [
                    '/dashboard', '/calculadora', '/pedidos', '/clientes', '/catalogo',
                    '/produccion', '/produccion/calendario', '/stock',
                    '/maquinas', '/materiales', '/personal', '/reportes', '/ajustes'
                ],
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
            },
            {
                id: 'taller-free',
                name: 'TALLER FREE',
                category: 'MECHANIC_WORKSHOP',
                price: 0,
                currency: 'ARS',
                description: 'Gestión básica para talleres individuales.',
                features: ['Hasta 5 servicios / mes', '1 rampa / mecánico', 'Gestión de Clientes Básica'],
                sidebarItems: [
                    '/dashboard', '/pedidos', '/clientes', '/ajustes'
                ],
                maxUsers: 1,
                maxOrdersPerMonth: 5,
                maxBusinesses: 1,
                maxMachines: 1,
                isRecommended: false,
                ctaText: 'Empezar ahora',
                ctaLink: '/register',
                sortOrder: 3,
                active: true,
                hasTrial: false,
                trialDays: 0,
            },
            {
                id: 'taller-inicial',
                name: 'TALLER INICIAL',
                category: 'MECHANIC_WORKSHOP',
                price: 25000,
                currency: 'ARS',
                description: 'Perfecto para talleres individuales o pequeños.',
                features: ['Hasta 20 servicios / mes', '1 rampa / mecánico', 'Gestión de Clientes', 'Ficha de Vehículos', 'Reportes Básicos'],
                sidebarItems: [
                    '/dashboard', '/pedidos', '/clientes', '/vehiculos',
                    '/personal', '/reportes', '/ajustes'
                ],
                maxUsers: 2,
                maxOrdersPerMonth: 20,
                maxBusinesses: 1,
                maxMachines: 1,
                isRecommended: true,
                ctaText: 'Empezar prueba gratis',
                ctaLink: '/register',
                sortOrder: 4,
                active: true,
                hasTrial: true,
                trialDays: 30,
            },
            {
                id: 'taller-profesional',
                name: 'TALLER PROFESIONAL',
                category: 'MECHANIC_WORKSHOP',
                price: 45000,
                currency: 'ARS',
                description: 'Para talleres en crecimiento con más movimiento.',
                features: ['Hasta 100 servicios / mes', '3 rampas / mecánicos', 'Gestión de Repuestos', 'Ficha de Vehículos Full', 'Soporte prioritario'],
                sidebarItems: [
                    '/dashboard', '/pedidos', '/clientes', '/vehiculos',
                    '/personal', '/reportes', '/ajustes'
                ],
                maxUsers: 5,
                maxOrdersPerMonth: 100,
                maxBusinesses: 1,
                maxMachines: 3,
                isRecommended: false,
                ctaText: 'Mejorar ahora',
                ctaLink: '/register',
                sortOrder: 5,
                active: true,
                hasTrial: true,
                trialDays: 14,
            },
            {
                id: 'taller-premium',
                name: 'TALLER PREMIUM',
                category: 'MECHANIC_WORKSHOP',
                price: 75000,
                currency: 'ARS',
                description: 'Gestión total para talleres de alto rendimiento.',
                features: ['Servicios ilimitados', 'Rampas ilimitadas', 'Multi-usuario avanzado', 'Reportes Industriales', 'Personalización total'],
                sidebarItems: [
                    '/dashboard', '/pedidos', '/clientes', '/vehiculos',
                    '/personal', '/reportes', '/ajustes'
                ],
                maxUsers: 20,
                maxOrdersPerMonth: 9999,
                maxBusinesses: 1,
                maxMachines: 10,
                isRecommended: false,
                ctaText: 'Contacto comercial',
                ctaLink: '/register',
                sortOrder: 6,
                active: true,
                hasTrial: true,
                trialDays: 7,
            },
            {
                id: 'metalurgica-free',
                name: 'METALÚRGICA FREE',
                category: 'METALURGICA',
                price: 0,
                currency: 'ARS',
                description: 'Gestión esencial para pequeños talleres de herrería.',
                features: ['5 trabajos / mes', '1 puesto de trabajo', 'Gestión de materiales básica'],
                sidebarItems: ['/dashboard', '/pedidos', '/materiales', '/ajustes'],
                maxUsers: 1,
                maxOrdersPerMonth: 5,
                maxBusinesses: 1,
                maxMachines: 1,
                isRecommended: false,
                ctaText: 'Empezar ahora',
                ctaLink: '/register',
                sortOrder: 7,
                active: true,
                hasTrial: false,
                trialDays: 0,
            },
            {
                id: 'kiosco-free',
                name: 'KIOSCO FREE',
                category: 'KIOSCO',
                price: 0,
                currency: 'ARS',
                description: 'Control básico para kioscos pequeños.',
                features: ['5 ventas / mes', 'Terminal de Venta', 'Gestión de Caja', 'Control de Stock', 'Proveedores y Compras', '1 usuario'],
                sidebarItems: [
                    '/dashboard', 
                    '/kiosco/venta', 
                    '/kiosco/caja', 
                    '/kiosco/productos', 
                    '/kiosco/proveedores', 
                    '/kiosco/compras', 
                    '/kiosco/gastos',
                    '/ajustes'
                ],
                maxUsers: 1,
                maxOrdersPerMonth: 5,
                maxBusinesses: 1,
                maxMachines: 0,
                isRecommended: false,
                ctaText: 'Empezar ahora',
                ctaLink: '/register',
                sortOrder: 10,
                active: true,
                hasTrial: false,
                trialDays: 0,
            },
            {
                id: 'carpinteria-free',
                name: 'CARPINTERIA FREE',
                category: 'CARPINTERIA',
                price: 0,
                currency: 'ARS',
                description: 'Gestión esencial para carpinteros solitarios.',
                features: ['5 trabajos / mes', '1 banco de trabajo', 'Caja básica'],
                sidebarItems: ['/dashboard', '/pedidos', '/materiales', '/ajustes'],
                maxUsers: 1,
                maxOrdersPerMonth: 5,
                maxBusinesses: 1,
                maxMachines: 1,
                isRecommended: false,
                ctaText: 'Empezar ahora',
                ctaLink: '/register',
                sortOrder: 20,
                active: true,
                hasTrial: false,
                trialDays: 0,
            }
        ];

        for (const planData of defaults) {
            try {
                const existing = await this.planRepository.findOneBy({ id: planData.id });
                if (!existing) {
                    await this.planRepository.save(this.planRepository.create(planData));
                    console.log(`[SEED] Created new plan: ${planData.id}`);
                } else {
                    // Force update to sync sidebarItems and features
                    await this.planRepository.update(planData.id, {
                        sidebarItems: planData.sidebarItems,
                        features: planData.features,
                        category: planData.category,
                        description: planData.description
                    } as any);
                    console.log(`[SEED] Updated existing plan: ${planData.id}`);
                }
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
            relations: ['memberships', 'memberships.user'],
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

    async createUser(data: any, adminId: string): Promise<User> {
        const { email, fullName, phone, plan } = data;

        // 0. Verificar si se permiten emails temporales
        const config = await this.getPlatformConfig();
        if (!config.allowTemporaryEmails && this.isEmailDisposable(email, config.blockedDomains)) {
            throw new BadRequestException('No se permiten correos electrónicos temporales o desechables en esta plataforma.');
        }

        // 1. Verificar si ya existe en nuestra DB local
        const existingLocal = await this.userRepository.findOneBy({ email });
        if (existingLocal) {
            throw new ConflictException('Este email ya está registrado en la base de datos local.');
        }

        let authId: string = null;

        // 2. Intentar invitar vía Supabase Auth
        // El método inviteUserByEmail envía automáticamente el correo de "Invite User" configurado en el Dashboard
        const { data: authData, error } = await this.supabaseService.getClient().auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: fullName,
                phone: phone,
                plan: plan || 'free-3d'
            }
        });

        if (error) {
            // Si ya existe en Supabase, intentamos recuperarlo para sincronizar
            if (error.message.includes('already been registered') || error.message.includes('already exists')) {
                const { data: listData } = await this.supabaseService.getClient().auth.admin.listUsers();
                const existingAuth = listData?.users?.find((u: any) => u.email === email);

                if (!existingAuth) {
                    throw new ConflictException('El email figura como registrado pero no se pudo recuperar su ID.');
                }
                authId = existingAuth.id;
            } else {
                throw new Error(`Error al invitar usuario en Supabase: ${error.message}`);
            }
        } else {
            authId = authData.user.id;
        }

        await this.logAction(adminId, 'USER_INVITED_BY_ADMIN', authId, { email });

        // 3. Auto-Sincronización
        let user = await this.userRepository.findOneBy({ id: authId });

        if (!user) {
            console.log(`[AdminService] User ${authId} missing locally. Creating manually...`);
            user = this.userRepository.create({
                id: authId,
                email,
                fullName,
                plan: plan || 'FREE',
                status: 'PENDING', // Queda pendiente hasta que acepte la invitación
                globalRole: 'USER',
                active: true
            });
            await this.userRepository.save(user);
        }

        return this.findUserById(authId);
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
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'PRODUCTION_MACHINES', 'INVENTORY_RAW', 'SALES_MANAGEMENT'],
                config: {
                    sidebarItems: ['/dashboard', '/presupuestos', '/pedidos', '/stock', '/clientes', '/personal', '/maquinas', '/materiales', '/reportes', '/ajustes'],
                    labels: {
                        produccion: 'Producción',
                        items: 'Modelos a Imprimir',
                        maquinas: 'Impresoras',
                        materiales: 'Filamentos',
                        unidadName: 'Nombre de Impresora',
                        unidadModel: 'Modelo / Marca',
                    },
                    icons: { pedidos: 'Box', produccion: 'Cpu', maquinas: 'Printer', materiales: 'Layers' },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                        { key: 'productionOrders', label: 'Producción en Curso', icon: 'Printer', format: 'number' },
                        { key: 'activePrinters', label: 'Impresoras Activas', icon: 'Zap', format: 'number' },
                    ],
                    productionStages: [
                        { key: 'QUOTATION', label: 'Presupuesto', color: 'bg-indigo-500' },
                        { key: 'BUDGET_GENERATED', label: 'Presupuesto Enviado', color: 'bg-amber-500' },
                        { key: 'BUDGET_REJECTED', label: 'Presupuesto Rechazado', color: 'bg-red-400' },
                        { key: 'PENDING', label: 'Pendiente', color: 'bg-zinc-100' },
                        { key: 'DESIGN', label: 'En Diseño', color: 'bg-indigo-500' },
                        { key: 'IN_PROGRESS', label: 'En Proceso', color: 'bg-blue-500' },
                        { key: 'READY', label: 'Listo', color: 'bg-emerald-500' },
                        { key: 'FAILED', label: 'Fallo de Impresión', color: 'bg-red-500' },
                        { key: 'REPRINT_PENDING', label: 'Pendiente Reimpresión', color: 'bg-orange-400' },
                        { key: 'POST_PROCESS', label: 'Post-Proceso', color: 'bg-amber-500' },
                        { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' },
                        { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
                        { key: 'IN_STOCK', label: 'Ingresado a Stock', color: 'bg-purple-500' },
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: PLA Negro Pro / PETG Gris',
                        brandPlaceholder: 'Ej: Grilon3 / Printalot',
                        defaultUnit: 'g',
                        defaultType: 'PLA',
                        types: [{ key: 'PLA', label: 'PLA' }, { key: 'PETG', label: 'PETG' }, { key: 'ABS', label: 'ABS' }, { key: 'TPU', label: 'TPU' }, { key: 'RESIN', label: 'RESINA' }, { key: 'LIMPIEZA', label: 'FILAMENTO LIMPIEZA' }],
                        units: [{ key: 'g', label: 'Gramos (g)' }, { key: 'kg', label: 'Kilos (kg)' }],
                    },
                    itemFields: [
                        { key: 'nombreProducto', label: 'Nombre del Modelo / Trabajo', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej. Llavero de pared' },
                        { key: 'tipo_filamento', label: 'Tipo de Filamento (General)', tipo: 'select', section: 'INFORMACIÓN DEL TRABAJO', options: ['PLA', 'PETG', 'ABS', 'TPU', 'RESIN', 'NYLON', 'FLEX'], required: false },
                        { key: 'seDiseñaSTL', label: '¿Se diseña el STL?', tipo: 'boolean', section: 'INFORMACIÓN DEL TRABAJO' },
                        { key: 'precioDiseno', label: 'Costo de diseño ($)', tipo: 'money', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej. 2500' },
                        { key: 'url_stl', label: 'URL STL', tipo: 'url', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'https://...' },
                        { key: 'reference_image', label: 'Imagen de Referencia', tipo: 'url', section: 'INFORMACIÓN DEL TRABAJO' },
                        { key: 'cantidad', label: 'Cantidad', tipo: 'number', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: '1' },
                        { key: 'peso_gramos', label: 'Peso estimado (G)', tipo: 'number', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. 150' },
                        { key: 'duracion_estimada_minutos', label: 'Duración (MIN)', tipo: 'number', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. 120' },
                    ],
                    features: { hasNozzle: true, hasMaxFilaments: true, hasVisits: false, hasQuotes: true, hasMaterials: true, hasVehicles: false },
                    machineStatusLabels: { WORKING: 'Imprimiendo', MAINTENANCE: 'Mantenimiento / Calibración', IDLE: 'Lista para Imprimir' },
                    staffPlaceholder: 'Ej: Operario de Impresión, Modelador, Post-procesado...',
                    catalogCategories: [
                        'REPUESTOS Y MECÁNICA',
                        'FIGURAS Y COLECCIONABLES',
                        'LLAVEROS Y ACCESORIOS',
                        'HUEFORGE Y LITOFANÍAS',
                        'ARTICULADOS Y FLEXIS',
                        'JUGUETES Y JUEGOS',
                        'HERRAMIENTAS Y GADGETS',
                        'COSPLAY Y MÁSCARAS',
                        'ORGANIZADORES Y OFICINA',
                        'HOGAR Y DECORACIÓN'
                    ]
                }
            },
            {
                key: 'MECHANIC_WORKSHOP',
                name: 'Taller de Motos / Mecánica',
                description: 'Gestión de reparaciones, service por kilometraje, historial por patente y rampa de trabajo.',
                imageKey: 'mechanic-template',
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'PRODUCTION_MACHINES', 'INVENTORY_RAW', 'SALES_MANAGEMENT', 'VEHICLE_HISTORY'],
                config: {
                    sidebarItems: ['/dashboard', '/pedidos', '/vehiculos', '/clientes', '/produccion', '/stock', '/personal', '/reportes', '/ajustes'],
                    labels: {
                        produccion: 'Rampas',
                        items: 'Tareas / Reparaciones',
                        pedidos: 'Servicios',
                        maquinas: 'Rampas',
                        materiales: 'Repuestos / Insumos',
                        unidadName: 'Nombre de la Rampa',
                        unidadModel: 'Capacidad / Tipo',
                        mostrarStock: 'false',
                        accionNuevoPedido: 'Nuevo Servicio',
                        finalizarPedido: 'Finalizar Servicio'
                    },
                    icons: { pedidos: 'Wrench', produccion: 'Hammer', maquinas: 'Wrench', materiales: 'Package' },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                        { key: 'activeOrders', label: 'Vehículos en Taller', icon: 'Hammer', format: 'number' },
                        { key: 'productionOrders', label: 'Tareas Pendientes', icon: 'Clock', format: 'number' },
                    ],
                    productionStages: [
                        { key: 'PENDING', label: 'Recepción / Espera', color: 'bg-zinc-100' },
                        { key: 'DIAGNOSTICO', label: 'Diagnóstico', color: 'bg-blue-400' },
                        { key: 'ESPERANDO_REPUESTOS', label: 'Esperando Repuestos', color: 'bg-amber-500' },
                        { key: 'IN_PROGRESS', label: 'En Rampa / Reparando', color: 'bg-blue-600' },
                        { key: 'READY', label: 'Listo para Entrega', color: 'bg-emerald-500' },
                        { key: 'DONE', label: 'Finalizado', color: 'bg-emerald-600' },
                        { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: Filtro de aceite / Pastillas freno',
                        brandPlaceholder: 'Ej: Mahle / Brembo',
                        defaultUnit: 'uds',
                        defaultType: 'REPUESTO',
                        types: [{ key: 'REPUESTO', label: 'REPUESTO' }, { key: 'LUBRICANTE', label: 'LUBRICANTE / FLUIDO' }, { key: 'INSUMO', label: 'INSUMO TALLER' }, { key: 'OTRO', label: 'OTRO' }],
                        units: [{ key: 'uds', label: 'Unidades (uds)' }, { key: 'l', label: 'Litros (l)' }, { key: 'ml', label: 'Mililitros (ml)' }],
                    },
                    itemFields: [
                        {
                            key: 'nombreProducto',
                            label: 'Trabajo / Servicio',
                            tipo: 'select',
                            required: true,
                            options: [
                                'Service General',
                                'Cambio de Aceite y Filtros',
                                'Frenos (Pastillas/Discos)',
                                'Carburación / Inyección',
                                'Transmisión (Cadena/Corona/Piñón)',
                                'Suspensión / Barrales',
                                'Electricidad / Batería',
                                'Gomería / Cubiertas',
                                'Motor (Ajuste/Reparación)',
                                'Lavado y Lubricación',
                                'Diagnóstico Computarizado',
                                'Otro (Especificar en diagnóstico)'
                            ],
                            placeholder: 'Seleccionar trabajo...'
                        },
                        { key: 'materiales_utilizados', label: 'Repuestos / Insumos', tipo: 'key-value-list', section: 'RECURSOS' },
                        { key: 'reference_image', label: 'Foto del Estado / Recepción', tipo: 'url', section: 'GENERAL', placeholder: 'Evidencia Fotográfica' },
                        { key: 'descripcion', label: 'Observaciones de Diagnóstico', tipo: 'textarea', section: 'GENERAL', placeholder: 'Detallar fallas encontradas...' },
                    ],
                    features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: false, hasQuotes: true, hasMaterials: true, hasVehicles: true },
                    machineStatusLabels: { WORKING: 'Ocupada', MAINTENANCE: 'Fuera de Servicio', IDLE: 'Disponible' },
                    staffPlaceholder: 'Ej: Mecánico, Ayudante, Recepcionista...',
                }
            },
            {
                key: 'KIOSCO',
                name: 'Kiosco / Minimarket',
                description: 'Gestión ágil de ventas minoristas, control de stock por unidad y seguimiento de caja diaria.',
                imageKey: 'kiosco-template',
                defaultCapabilities: ['SALES_MANAGEMENT', 'INVENTORY_RETAIL', 'FINANCIAL_BASIC'],
                config: {
                    sidebarItems: [
                        '/dashboard', 
                        '/kiosco/venta', 
                        '/kiosco/caja', 
                        '/kiosco/productos', 
                        '/kiosco/proveedores', 
                        '/kiosco/compras', 
                        '/kiosco/gastos',
                        '/ajustes'
                    ],
                    labels: {
                        pedidos: 'Ventas Históricas',
                        nuevoPedido: 'NUEVA VENTA',
                        items: 'Artículos',
                        produccion: 'Caja',
                        stock: 'Stock'
                    },
                    icons: { 
                        pedidos: 'ReceiptText', 
                        produccion: 'Calculator',
                        stock: 'PackageSearch'
                    },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'activeSales', label: 'Ventas de Hoy', icon: 'ShoppingCart', format: 'number' },
                        { key: 'lowStock', label: 'Alertas de Stock', icon: 'AlertTriangle', format: 'number' },
                    ],
                    productionStages: [
                        { key: 'PENDING', label: 'Pendiente Pago', color: 'bg-zinc-100' },
                        { key: 'DONE', label: 'Vendido/Cerrado', color: 'bg-emerald-500' },
                        { key: 'CANCELLED', label: 'Anulado', color: 'bg-red-500' }
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: Coca Cola 500ml',
                        brandPlaceholder: 'Ej: Coca Cola Company',
                        defaultUnit: 'uds',
                        defaultType: 'PRODUCTO',
                        types: [{ key: 'PRODUCTO', label: 'Producto' }],
                        units: [{ key: 'uds', label: 'Unidad' }],
                    },
                    itemFields: [],
                    features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: false, hasQuotes: false, hasMaterials: false, hasVehicles: false },
                    machineStatusLabels: { WORKING: 'Abierta', MAINTENANCE: 'Cerrada / Arqueo', IDLE: 'Lista' },
                    staffPlaceholder: 'Ej: Vendedor, Cajero...',
                }
            },
            {
                key: 'METALURGICA',
                name: 'Metalúrgica / Herrería',
                description: 'Gestión de proyectos metalúrgicos, corte, soldadura y seguimiento de materiales.',
                imageKey: 'metalurgica-template',
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'SALES_MANAGEMENT', 'INVENTORY_RAW'],
                config: {
                    sidebarItems: ['/dashboard', '/visitas', '/presupuestos', '/pedidos', '/stock', '/clientes', '/personal', '/materiales', '/maquinas', '/reportes', '/ajustes'],
                    labels: {
                        produccion: 'Monitor de Taller',
                        items: 'Planos & Estructuras',
                        maquinas: 'Puestos de Trabajo',
                        materiales: 'Materiales',
                        unidadName: 'Nombre del Puesto / Operario',
                        unidadModel: 'Especialidad / Equipo',
                    },
                    icons: { visitas: 'Calendar', presupuestos: 'Zap', pedidos: 'FileText', produccion: 'Cog', maquinas: 'Wrench', materiales: 'Grid' },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                        { key: 'productionOrders', label: 'Fabricación en Curso', icon: 'Cog', format: 'number' },
                        { key: 'activeOrders', label: 'Proyectos Activos', icon: 'HardHat', format: 'number' },
                    ],
                    productionStages: [
                        { key: 'SITE_VISIT', label: 'Visita Técnica', color: 'bg-indigo-500' },
                        { key: 'SITE_VISIT_DONE', label: 'Visita Realizada', color: 'bg-emerald-500' },
                        { key: 'VISITA_REPROGRAMADA', label: 'Visita Reprogramada', color: 'bg-orange-400' },
                        { key: 'VISITA_CANCELADA', label: 'Visita Cancelada', color: 'bg-red-400' },
                        { key: 'QUOTATION', label: 'Presupuesto Pendiente', color: 'bg-blue-500' },
                        { key: 'BUDGET_GENERATED', label: 'Presupuesto Enviado', color: 'bg-amber-500' },
                        { key: 'BUDGET_REJECTED', label: 'Presupuesto Rechazado', color: 'bg-zinc-400' },
                        { key: 'SURVEY_DESIGN', label: 'Relevamiento / Diseño', color: 'bg-blue-400' },
                        { key: 'APPROVED', label: 'Presupuesto Confirmado', color: 'bg-primary' },
                        { key: 'OFFICIAL_ORDER', label: 'En Taller / Cola', color: 'bg-zinc-100' },
                        { key: 'CUTTING', label: 'Corte', color: 'bg-orange-500' },
                        { key: 'WELDING', label: 'Soldadura', color: 'bg-blue-600' },
                        { key: 'ASSEMBLY', label: 'Armado', color: 'bg-amber-600' },
                        { key: 'PAINTING', label: 'Pintura', color: 'bg-purple-500' },
                        { key: 'INSTALACION_OBRA', label: 'Instalación en Obra', color: 'bg-indigo-600' },
                        { key: 'FAILED', label: 'Fallo / Error', color: 'bg-red-500' },
                        { key: 'DONE', label: 'Listo p/ Entrega', color: 'bg-emerald-500' },
                        { key: 'DELIVERED', label: 'Entregado (Cerrado)', color: 'bg-zinc-100' },
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: Caño 40x40 / Chapa N18 / Electrodo 6013',
                        brandPlaceholder: 'Ej: Acer Bragado / Acindar / Sin Marca',
                        defaultUnit: 'm',
                        defaultType: 'PERFIL',
                        types: [{ key: 'PERFIL', label: 'PERFIL / CAÑO' }, { key: 'CHAPA', label: 'CHAPA' }, { key: 'MACHO', label: 'MACHIMBRE' }, { key: 'HERRAJE', label: 'HERRAJE / ACCESORIO' }, { key: 'INSUMO', label: 'INSUMO (DISCO/ELECTRODO)' }, { key: 'OTRO', label: 'OTRO' }],
                        units: [{ key: 'm', label: 'Metros (m)' }, { key: 'uds', label: 'Unidades (uds)' }, { key: 'kg', label: 'Kilos (kg)' }, { key: 'barras', label: 'Barras (6m)' }, { key: 'placas', label: 'Placas/Chapas' }],
                    },
                    itemFields: [
                        { key: 'tipo_trabajo', label: 'Tipo de Trabajo', tipo: 'select', section: 'INFORMACIÓN DEL TRABAJO', options: ['Portón', 'Reja', 'Escalera', 'Estructura', 'Puerta', ' Paño Fijo', 'Otro'], required: true },
                        { key: 'nombreProducto', label: 'Descripción / Nombre', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej: Portón principal frente' },
                        { key: 'medidas', label: 'Medidas (Ancho x Alto)', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej: 3.50 x 2.10 m' },
                        { key: 'cantidad', label: 'Cantidad', tipo: 'number', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: '1' },
                        { key: 'material_estructura', label: 'Material Estructura', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Tubo 40x40' },
                        { key: 'revestimiento', label: 'Revestimiento (Machimbre/Chapa)', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Machimbre de Pino / Chapa N°18' },
                        { key: 'terminacion', label: 'Terminación / Proceso', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Pintura epoxi al horno' },
                        { key: 'color', label: 'Color Final', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Negro microtexturado' },
                    ],
                    features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: true, hasQuotes: true, hasMaterials: true, hasVehicles: false },
                    machineStatusLabels: { WORKING: 'En Producción', MAINTENANCE: 'Fuera de Servicio / Reparación', IDLE: 'Disponible / Espera' },
                    staffPlaceholder: 'Ej: Soldador, Pintor, Armado, Plegador...',
                }
            },
            {
                key: 'CARPINTERIA',
                name: 'Carpintería',
                description: 'Gestión de carpintería, optimización de cortes, ensamble y acabados.',
                imageKey: 'carpinteria-template',
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'SALES_MANAGEMENT', 'INVENTORY_RAW'],
                config: {
                    sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/personal', '/reportes', '/ajustes'],
                    labels: {
                        produccion: 'Estado de Armado',
                        items: 'Muebles y Componentes',
                        maquinas: 'Bancos / Operarios',
                        materiales: 'Maderas',
                        unidadName: 'Nombre del Banco / Operario',
                        unidadModel: 'Especialidad / Herramientas',
                    },
                    icons: { pedidos: 'ClipboardList', produccion: 'Hammer', maquinas: 'Wrench', materiales: 'Trees' },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                        { key: 'productionOrders', label: 'Muebles en Armado', icon: 'Hammer', format: 'number' },
                        { key: 'activeOrders', label: 'Pedidos Pendientes', icon: 'ShoppingCart', format: 'number' },
                    ],
                    productionStages: [
                        { key: 'PENDING', label: 'Planificación', color: 'bg-zinc-100' },
                        { key: 'CUTTING', label: 'Corte de Placas', color: 'bg-orange-400' },
                        { key: 'ARMADO', label: 'En Armado', color: 'bg-blue-500' },
                        { key: 'BARNIZADO', label: 'Lustre / Barniz', color: 'bg-amber-600' },
                        { key: 'FAILED', label: 'Rehacer / Error', color: 'bg-red-500' },
                        { key: 'RE_WORK', label: 'En Ajuste / Reparación', color: 'bg-orange-400' },
                        { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' },
                        { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
                        { key: 'IN_STOCK', label: 'Ingresado a Stock', color: 'bg-purple-500' },
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: Placa Melamina 18mm / Cola Vinílica',
                        brandPlaceholder: 'Ej: Faplac / Egger / Sin Marca',
                        defaultUnit: 'uds',
                        defaultType: 'PLACA',
                        types: [{ key: 'PLACA', label: 'PLACA / TABLERO' }, { key: 'MADERA', label: 'MADERA MACIZA / LISTÓN' }, { key: 'HERRAJE', label: 'HERRAJE / TIRADOR' }, { key: 'INSUMO', label: 'INSUMO (COLA/LIJA)' }, { key: 'OTRO', label: 'OTRO' }],
                        units: [{ key: 'uds', label: 'Unidades (uds)' }, { key: 'm', label: 'Metros (m)' }, { key: 'm2', label: 'M2 (Superficie)' }],
                    },
                    itemFields: [
                        { key: 'nombreProducto', label: 'Mueble / Producto', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej. Mesa ratona' },
                        { key: 'madera', label: 'Tipo de Madera', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. Pino, Roble' },
                        { key: 'medidas', label: 'Dimensiones Finales', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej. 120 x 80 x 45 cm' },
                        { key: 'herrajes', label: 'Detalle de Herrajes', tipo: 'textarea', section: 'ESPECIFICACIONES TÉCNICAS' },
                    ],
                    features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: false, hasQuotes: false, hasMaterials: true, hasVehicles: false },
                    machineStatusLabels: { WORKING: 'En Armado', MAINTENANCE: 'Fuera de Servicio', IDLE: 'Banco Libre' },
                    staffPlaceholder: 'Ej: Carpintero, Lijador, Lustrador, Diseñador...',
                }
            }
        ];

        for (const t of templatesToSeed) {
            const existing = await repo.findOneBy({ key: t.key as any });
            if (!existing) {
                await repo.save(repo.create({ ...t, key: t.key as any }));
                console.log(`[SEED] Created new template: ${t.key}`);
            } else {
                // Force update config and capabilities
                await repo.update(existing.id, {
                    config: t.config,
                    defaultCapabilities: t.defaultCapabilities,
                    description: t.description,
                    name: t.name
                } as any);
                console.log(`[SEED] Synchronized template: ${t.key}`);
            }
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
            plans: await this.planRepository.find({ select: ['id', 'name', 'category'] })
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
