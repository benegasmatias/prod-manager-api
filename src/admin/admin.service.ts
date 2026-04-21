import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
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
                name: 'Free por Siempre',
                category: 'IMPRESION_3D',
                price: 0,
                currency: 'ARS',
                description: 'Ideal para hobbistas y makers solitarios.',
                features: ['30 pedidos / mes', '1 impresora', 'Solo propietario (1 usuario)', 'Smart Dashboard', 'Gestion de clientes'],
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
                name: 'Taller Inicial',
                category: 'IMPRESION_3D',
                price: 8900,
                currency: 'ARS',
                description: 'Para pequeños talleres que empiezan a crecer.',
                features: ['60 pedidos / mes', '2 impresoras', '2 usuarios', 'Full Dashboard', 'Gestion de clientes', 'Control de materiales', 'Soporte prioritario'],
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
                name: 'Granja Produccion',
                category: 'IMPRESION_3D',
                price: 24500,
                currency: 'ARS',
                description: 'Para granjas con alto volumen de produccion.',
                features: ['Ilimitados pedidos', 'Ilimitadas impresoras', '10 usuarios', 'Full Dashboard', 'Reportes avanzados', 'Control de materiales', 'Soporte prioritario'],
                maxUsers: 10,
                maxOrdersPerMonth: 0,
                maxBusinesses: 1,
                maxMachines: 0,
                isRecommended: false,
                ctaText: 'Mejorar ahora',
                ctaLink: '/register',
                sortOrder: 2,
                active: true,
                hasTrial: true,
                trialDays: 7,
            },
        ];

        for (const plan of defaults) {
            try {
                const existing = await this.planRepository.findOneBy({ id: plan.id });
                if (!existing) {
                    await this.planRepository.save(this.planRepository.create(plan));
                    console.log(`[SEED] Created plan: ${plan.id}`);
                } else {
                    await this.planRepository.save({ ...existing, ...plan });
                    console.log(`[SEED] Updated plan: ${plan.id}`);
                }
            } catch (err) {
                console.error(`[SEED] Error in plan ${plan.id}:`, err.message);
            }
        }
        console.log('Default subscription plans seeding process finished');
    }

    async findAllPlans(category?: string): Promise<SubscriptionPlan[]> {
        const where: any = {};
        if (category) where.category = category;
        return this.planRepository.find({ where, order: { sortOrder: 'ASC' } });
    }

    async findActivePlans(category?: string): Promise<SubscriptionPlan[]> {
        const where: any = { active: true };
        if (category) where.category = category;
        return this.planRepository.find({
            where,
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

    async findAllBusinesses(): Promise<Business[]> {
        return this.businessRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['memberships'],
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
}
