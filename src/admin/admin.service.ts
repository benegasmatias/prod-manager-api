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
                name: 'Gratis',
                price: 0,
                currency: 'ARS',
                description: 'Perfecto para empezar y conocer el sistema.',
                features: ['15 pedidos por mes', '1 negocio', '2 máquinas', '1 usuario', 'Dashboard básico', 'Gestión de clientes'],
                maxUsers: 1,
                maxOrdersPerMonth: 15,
                maxBusinesses: 1,
                maxMachines: 2,
                isRecommended: false,
                ctaText: 'Comenzar gratis',
                ctaLink: '/register',
                sortOrder: 0,
                active: true,
                hasTrial: false,
                trialDays: 0,
            },
            {
                id: 'pro',
                name: 'Pro',
                price: 10990,
                currency: 'ARS',
                description: 'Para talleres en crecimiento que necesitan más.',
                features: ['50 pedidos por mes', '1 negocio (máx.)', '10 máquinas', '5 usuarios', 'Dashboard completo', 'Gestión de clientes', 'Control de materiales', 'Soporte por email'],
                maxUsers: 5,
                maxOrdersPerMonth: 50,
                maxBusinesses: 1,
                maxMachines: 10,
                isRecommended: true,
                ctaText: 'Probar 14 días gratis',
                ctaLink: '/register',
                sortOrder: 1,
                active: true,
                hasTrial: true,
                trialDays: 14,
            },
            {
                id: 'business',
                name: 'Business',
                price: 22990,
                currency: 'ARS',
                description: 'Para talleres grandes con necesidades avanzadas.',
                features: ['Pedidos ilimitados', '1 negocio (máx.)', 'Máquinas ilimitadas', 'Usuarios ilimitados', 'Dashboard completo', 'Reportes avanzados', 'Control de materiales', 'Soporte prioritario', 'Integraciones'],
                maxUsers: 0,
                maxOrdersPerMonth: 0,
                maxBusinesses: 1,
                maxMachines: 0,
                isRecommended: false,
                ctaText: 'Contactar ventas',
                ctaLink: '/register',
                sortOrder: 2,
                active: true,
                hasTrial: false,
                trialDays: 0,
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

    async initializeCapabilities(): Promise<any> {
        const businesses = await this.businessRepository.find();
        let updated = 0;
        for (const b of businesses) {
            if (!b.capabilities || b.capabilities.length === 0) {
                // Initialize based on existing category
                if (['IMPRESION_3D', 'METALURGICA', 'CARPINTERIA', 'GENERICO'].includes(b.category)) {
                    b.capabilities = [
                        'PRODUCTION_MANAGEMENT', 
                        'PRODUCTION_MACHINES', 
                        'INVENTORY_RAW', 
                        'SALES_BASIC'
                    ];
                } else {
                    b.capabilities = ['SALES_BASIC'];
                }
                await this.businessRepository.save(b);
                updated++;
            }
        }
        return { total: businesses.length, updated };
    }

    async seedRetailTemplate(): Promise<any> {
        const repo = this.dataSource.getRepository(BusinessTemplate);
        let template = await repo.findOneBy({ key: 'RETAIL_KIOSCO' });

        if (!template) {
            template = repo.create({
                key: 'RETAIL_KIOSCO',
                name: 'Kiosco / Punto de Venta',
                description: 'Ideal para ventas retail rápidas, control de caja única y stock simple.',
                imageKey: 'kiosk-template',
                requiredPlan: 'FREE',
                isAvailable: true,
                isEnabled: true,
                defaultCapabilities: ['SALES_BASIC', 'INVENTORY_RETAIL', 'FINANCE_CASH_DRAWER'],
                config: {
                    type: 'RETAIL',
                    primaryColor: '#7C3AED',
                    features: {
                        hasNozzle: false,
                        hasMaxFilaments: false,
                        hasVisits: true, // Para delivery opcional
                        hasQuotes: false, 
                        hasMaterials: false
                    }
                }
            });
            await repo.save(template);
            return { message: 'Retail template seeded successfully', template };
        }
        return { message: 'Retail template already exists', template };
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
