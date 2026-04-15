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
        private readonly notificationsService: NotificationsService,
    ) {
        // Seed default plans on startup if none exist
        this.seedDefaultPlans();
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

    async updateBusinessStatus(id: string, status: string): Promise<Business> {
        await this.businessRepository.update(id, { status });
        return this.findBusinessById(id);
    }

    async updateBusinessSubscription(id: string, planId: string, expiresAt: Date): Promise<Business> {
        await this.businessRepository.update(id, {
            planId,
            subscriptionExpiresAt: expiresAt,
            status: 'ACTIVE'
        });
        return this.findBusinessById(id);
    }

    async registerPayment(id: string, months: number): Promise<Business> {
        const business = await this.findBusinessById(id);
        const currentExpires = business.subscriptionExpiresAt || new Date();
        const newExpires = new Date(currentExpires);
        newExpires.setMonth(newExpires.getMonth() + months);

        await this.businessRepository.update(id, {
            subscriptionExpiresAt: newExpires,
            status: 'ACTIVE'
        });
        return this.findBusinessById(id);
    }


    // Usuarios locales (del ecosistema)
    async findAllUsers(): Promise<User[]> {
        return this.userRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async approveUser(id: string, adminId: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'ACTIVE',
            active: true,
            approvedAt: new Date(),
            approvedBy: adminId
        });
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async blockUser(id: string): Promise<User> {
        await this.userRepository.update(id, { 
            status: 'BLOCKED',
            active: false
        });
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
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

    async updateUserGlobalRole(id: string, role: string): Promise<User> {
        await this.userRepository.update(id, { globalRole: role });
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
        const [userCount, businessCount] = await Promise.all([
            this.userRepository.count(),
            this.businessRepository.count(),
        ]);

        const categories = await this.businessRepository
            .createQueryBuilder('business')
            .select('business.category', 'category')
            .addSelect('COUNT(business.id)', 'count')
            .groupBy('business.category')
            .getRawMany();

        return {
            users: userCount,
            businesses: businessCount,
            categories: categories.map(c => ({
                label: c.category,
                count: parseInt(c.count, 10),
            })),
        };
    }
}
