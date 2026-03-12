import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';

import { GlobalRoleConfig } from './entities/global-role-config.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class AdminService {
    constructor(
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
                price: 7990,
                currency: 'ARS',
                description: 'Para talleres en crecimiento que necesitan más.',
                features: ['50 pedidos por mes', 'Hasta 3 negocios', '10 máquinas', '5 usuarios', 'Dashboard completo', 'Gestión de clientes', 'Control de materiales', 'Soporte por email'],
                maxUsers: 5,
                maxOrdersPerMonth: 50,
                maxBusinesses: 3,
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
                price: 19990,
                currency: 'ARS',
                description: 'Para talleres grandes con necesidades avanzadas.',
                features: ['Pedidos ilimitados', 'Negocios ilimitados', 'Máquinas ilimitadas', 'Usuarios ilimitados', 'Dashboard completo', 'Reportes avanzados', 'Control de materiales', 'Soporte prioritario', 'Integraciones'],
                maxUsers: 0,
                maxOrdersPerMonth: 0,
                maxBusinesses: 0,
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

    async updateUserStatus(id: string, active: boolean): Promise<User> {
        await this.userRepository.update(id, { active });
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async updateUserGlobalRole(id: string, role: string): Promise<User> {
        await this.userRepository.update(id, { globalRole: role });
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }
}
