import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
export class AdminService {
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
    ) {
        // Seed default plans on startup if none exist
        this.seedDefaultPlans();
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

    // ──────────────── Plans CRUD ────────────────

    private async seedDefaultPlans() {
        const count = await this.planRepository.count();
        if (count > 0) return;

        const defaults: CreatePlanDto[] = [
            {
                id: 'free',
                name: 'Prueba Gratis',
                price: 0,
                currency: 'ARS',
                description: 'Probá el sistema con todas las funciones por 30 días.',
                features: ['15 pedidos / mes', '1 negocio', '3 máquinas max.', '1 usuario', 'Smart Dashboard', 'Gestión de clientes'],
                maxUsers: 1,
                maxOrdersPerMonth: 15,
                maxBusinesses: 1,
                maxMachines: 3,
                isRecommended: false,
                ctaText: 'Comenzar gratis',
                ctaLink: '/register',
                sortOrder: 0,
                active: true,
                hasTrial: true,
                trialDays: 30,
            },
            {
                id: 'pro',
                name: 'Pro',
                price: 10990,
                currency: 'ARS',
                description: 'Para talleres en crecimiento que necesitan más control.',
                features: ['50 pedidos / mes', '1 negocio', '10 máquinas max.', '3 usuarios', 'Full Dashboard', 'Gestión de clientes', 'Control de materiales', 'Soporte prioritario'],
                maxUsers: 3,
                maxOrdersPerMonth: 50,
                maxBusinesses: 1,
                maxMachines: 10,
                isRecommended: true,
                ctaText: 'Probar 30 días gratis',
                ctaLink: '/register',
                sortOrder: 1,
                active: true,
                hasTrial: true,
                trialDays: 30,
            },
            {
                id: 'business',
                name: 'Business',
                price: 29900,
                currency: 'ARS',
                description: 'Para talleres grandes con alto volumen de producción.',
                features: ['500 pedidos / mes', '1 negocio', '50 máquinas max.', '7 usuarios', 'Full Dashboard', 'Reportes avanzados', 'Control de materiales', 'Soporte prioritario'],
                maxUsers: 7,
                maxOrdersPerMonth: 500,
                maxBusinesses: 1,
                maxMachines: 50,
                isRecommended: false,
                ctaText: 'Probar 30 días gratis',
                ctaLink: '/register',
                sortOrder: 2,
                active: true,
                hasTrial: true,
                trialDays: 30,
            },
        ];

        for (const plan of defaults) {
            await this.planRepository.save(this.planRepository.create(plan));
        }
        console.log('✅ Default subscription plans seeded');
    }

    async findAllPlans(): Promise<SubscriptionPlan[]> {
        return this.planRepository.find({ order: { sortOrder: 'ASC' } });
    }

    async findActivePlans(): Promise<SubscriptionPlan[]> {
        return this.planRepository.find({
            where: { active: true },
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


    // Roles and Permissions
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



    // Negocios
    async findAllBusinesses(): Promise<Business[]> {
        return this.businessRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['memberships'], // Opcional para ver dueños
        });
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
        await this.logAction(adminId, 'BUSINESS_SUBSCRIPTION_UPDATE', id, { planId, expiresAt });
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
        await this.logAction(adminId, 'BUSINESS_PAYMENT_REGISTERED', id, { months, newExpires });
        return this.findBusinessById(id);
    }


    // Usuarios locales (del ecosistema)
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
        
        // Add invitations associated with this user's email
        (user as any).invitations = await this.invitationRepository.find({
            where: { email: user.email },
            relations: ['business', 'invitedByUser'],
        });
        
        return user;
    }

    async approveUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'ACTIVE',
            active: true,
            approvedAt: new Date(),
            approvedBy: adminId
        });
        await this.logAction(adminId, 'USER_APPROVED', id);
        return this.findUserById(id);
    }

    async blockUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'BLOCKED',
            active: false
        });
        await this.logAction(adminId, 'USER_BLOCKED', id);
        return this.findUserById(id);
    }

    async unblockUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'ACTIVE',
            active: true
        });
        await this.logAction(adminId, 'USER_UNBLOCKED', id);
        return this.findUserById(id);
    }

    async suspendUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'SUSPENDED',
            active: false
        });
        await this.logAction(adminId, 'USER_SUSPENDED', id);
        return this.findUserById(id);
    }

    async reactivateUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'ACTIVE',
            active: true
        });
        await this.logAction(adminId, 'USER_REACTIVATED', id);
        return this.findUserById(id);
    }

    async softDeleteUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'DELETED',
            active: false
        });
        await this.logAction(adminId, 'USER_DELETED', id);
        return this.findUserById(id);
    }

    // Invitaciones
    async findAllInvitations(
        page: number = 1, 
        limit: number = 10, 
        filters?: { search?: string, status?: string }
    ): Promise<{ items: BusinessInvitation[], meta: any }> {
        const query = this.invitationRepository.createQueryBuilder('invitation')
            .leftJoinAndSelect('invitation.business', 'business')
            .leftJoinAndSelect('invitation.invitedByUser', 'invitedBy');
        
        if (filters?.search) {
            query.andWhere('invitation.email ILIKE :search', { search: `%${filters.search}%` });
        }
        
        if (filters?.status) {
            query.andWhere('invitation.status = :status', { status: filters.status });
        }

        query.orderBy('invitation.createdAt', 'DESC')
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

    async resendInvitation(id: string, adminId: string): Promise<BusinessInvitation> {
        const invitation = await this.invitationRepository.findOneBy({ id });
        if (!invitation) throw new NotFoundException('Invitación no encontrada');
        
        // Reset expiration and increase count
        const newExpires = new Date();
        newExpires.setDate(newExpires.getDate() + 7); // 7 more days
        
        invitation.expiresAt = newExpires;
        invitation.resendCount += 1;
        invitation.lastResentAt = new Date();
        
        await this.invitationRepository.save(invitation);
        await this.logAction(adminId, 'INVITATION_RESENT', id, { email: invitation.email });
        
        return invitation;
    }

    async cancelInvitation(id: string, adminId: string): Promise<BusinessInvitation> {
        const invitation = await this.invitationRepository.findOneBy({ id });
        if (!invitation) throw new NotFoundException('Invitación no encontrada');
        
        invitation.status = InvitationStatus.CANCELLED;
        await this.invitationRepository.save(invitation);
        await this.logAction(adminId, 'INVITATION_CANCELLED', id, { email: invitation.email });
        
        return invitation;
    }

    async bootstrapAdmin(userId: string): Promise<User> {
        // Strict check: only allow if NO super admins exist in the entire platform
        const superAdminCount = await this.userRepository.count({
            where: { globalRole: 'SUPER_ADMIN' }
        });

        if (superAdminCount > 0) {
            throw new ForbiddenException('La plataforma ya ha sido inicializada. Contacte al administrador actual.');
        }

        await this.userRepository.update(userId, { 
            globalRole: 'SUPER_ADMIN',
            status: 'ACTIVE',
            active: true,
            approvedAt: new Date(),
            approvedBy: 'SYSTEM_BOOTSTRAP'
        });

        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async getUserAuditLogs(id: string): Promise<AdminAuditLog[]> {
        return this.auditLogRepository.find({
            where: { targetId: id },
            order: { timestamp: 'DESC' },
            take: 50,
        });
    }

    async updateUser(id: string, data: Partial<User>, adminId: string): Promise<User> {
        await this.userRepository.update(id, data);
        await this.logAction(adminId, 'USER_UPDATED', id, data);
        return this.findUserById(id);
    }

    async updateUserGlobalRole(id: string, role: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { globalRole: role });
        await this.logAction(adminId, 'USER_ROLE_UPDATED', id, { role });
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
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
                // Formula: repair => actual + missing
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

    /**
     * Used for new business creation flow.
     * Ensures the business starts with the correct baseline capabilities.
     */
    async initializeCapabilitiesForNewBusiness(business: Business): Promise<void> {
        const templates = await this.templateRepository.find();
        const template = templates.find(t => t.key === business.category);
        
        const audit = await this.calculateAlignment(business, template);
        if (audit.expected.length > 0) {
            business.capabilities = audit.expected;
            await this.businessRepository.save(business);
            await this.logAction('SYSTEM', 'CAPABILITIES_INITIALIZED', business.id, {
                capabilities: audit.expected
            });
        }
    }

    private async calculateAlignment(business: Business, template?: BusinessTemplate) {
        const actual = business.capabilities || [];
        
        // expected = union(systemDefaults, templateDefaultCapabilities, capabilities_override)
        const systemDefaults = ['SALES_BASIC'];
        const templateCaps = template?.defaultCapabilities || [];
        const overrides = Array.isArray(business.capabilitiesOverride) ? business.capabilitiesOverride : [];

        const expected = Array.from(new Set([
            ...systemDefaults,
            ...templateCaps,
            ...overrides
        ]));

        // missing = expected - actual
        const missing = expected.filter(cap => !actual.includes(cap));

        return { current: actual, expected, missing };
    }

    // --- Templates Management ---
    async findAllTemplates(): Promise<BusinessTemplate[]> {
        return this.templateRepository.find({ order: { name: 'ASC' } });
    }

    async updateTemplate(key: string, data: Partial<BusinessTemplate>): Promise<BusinessTemplate> {
        const template = await this.templateRepository.findOneBy({ key: key as any });
        if (!template) throw new NotFoundException('Template no encontrado');
        
        Object.assign(template, data);
        return this.templateRepository.save(template);
    }

    async seedAllTemplates(): Promise<any> {
        const repo = this.dataSource.getRepository(BusinessTemplate);
        const results = [];

        const templatesToSeed = [
            {
                key: 'IMPRESION_3D',
                name: 'Impresión 3D',
                description: 'Gestión de granjas de impresión, filamentos y servicios de diseño STL.',
                imageKey: '3d-printing-template',
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'PRODUCTION_MACHINES', 'INVENTORY_RAW', 'SALES_MANAGEMENT']
            },
            {
                key: 'METALURGICA',
                name: 'Herrería y Metalúrgica',
                description: 'Estructuras metálicas, visitas a obra y presupuestos detallados.',
                imageKey: 'metalwork-template',
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'PRODUCTION_MACHINES', 'INVENTORY_RAW', 'SALES_MANAGEMENT', 'VISITS_MANAGEMENT']
            },
            {
                key: 'CARPINTERIA',
                name: 'Carpintería',
                description: 'Amoblamientos a medida, corte de placas y armado en taller.',
                imageKey: 'carpentry-template',
                defaultCapabilities: ['PRODUCTION_MANAGEMENT', 'INVENTORY_RAW', 'SALES_MANAGEMENT']
            },
            {
                key: 'KIOSCO',
                name: 'Kiosco / Punto de Venta',
                description: 'Ventas retail, control de caja y stock simple.',
                imageKey: 'kiosk-template',
                defaultCapabilities: ['SALES_BASIC', 'INVENTORY_RETAIL', 'FINANCIAL_BASIC']
            }
        ];

        for (const t of templatesToSeed) {
            let temp = await repo.findOneBy({ key: t.key as any });
            if (!temp) {
                temp = repo.create({ ...t, key: t.key as any });
                results.push(`${t.key} created`);
            } else {
                temp.defaultCapabilities = t.defaultCapabilities;
                results.push(`${t.key} updated`);
            }
            await repo.save(temp);
        }

        return { message: 'Templates synchronized with base standards', results };
    }

    async getPlatformStats(): Promise<any> {
        const [userCount, businessCount, userStatusBreakdown] = await Promise.all([
            this.userRepository.count(),
            this.businessRepository.count(),
            this.userRepository
                .createQueryBuilder('user')
                .select('user.status', 'status')
                .addSelect('COUNT(user.id)', 'count')
                .groupBy('user.status')
                .getRawMany(),
        ]);

        const categories = await this.businessRepository
            .createQueryBuilder('business')
            .select('business.category', 'category')
            .addSelect('COUNT(business.id)', 'count')
            .groupBy('business.category')
            .getRawMany();

        return {
            users: {
                total: userCount,
                breakdown: userStatusBreakdown.map(s => ({
                    status: s.status,
                    count: parseInt(s.count, 10),
                })),
            },
            businesses: businessCount,
            categories: categories.map(c => ({
                label: c.category,
                count: parseInt(c.count, 10),
            })),
        };
    }

    async getMetadata() {
        // Source of truth for roles is the DB
        const roles = await this.roleConfigRepository.find();
        
        return {
            userStatuses: ['PENDING', 'ACTIVE', 'BLOCKED', 'SUSPENDED', 'DELETED'],
            invitationStatuses: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
            businessStatuses: ['DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'],
            globalRoles: roles.map(r => ({ id: r.role, label: r.role.replace('_', ' ') })),
            plans: await this.planRepository.find({ select: ['id', 'name'] })
        };
    }
}
