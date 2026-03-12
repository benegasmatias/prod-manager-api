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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const business_entity_1 = require("../businesses/entities/business.entity");
const user_entity_1 = require("../users/entities/user.entity");
const global_role_config_entity_1 = require("./entities/global-role-config.entity");
const subscription_plan_entity_1 = require("./entities/subscription-plan.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let AdminService = class AdminService {
    constructor(businessRepository, userRepository, roleConfigRepository, planRepository, notificationsService) {
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.roleConfigRepository = roleConfigRepository;
        this.planRepository = planRepository;
        this.notificationsService = notificationsService;
        this.seedDefaultPlans();
    }
    async seedDefaultPlans() {
        const count = await this.planRepository.count();
        if (count > 0)
            return;
        const defaults = [
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
    async findAllPlans() {
        return this.planRepository.find({ order: { sortOrder: 'ASC' } });
    }
    async findActivePlans() {
        return this.planRepository.find({
            where: { active: true },
            order: { sortOrder: 'ASC' },
        });
    }
    async findPlanById(id) {
        const plan = await this.planRepository.findOneBy({ id });
        if (!plan)
            throw new common_1.NotFoundException('Plan no encontrado');
        return plan;
    }
    async createPlan(dto) {
        const plan = this.planRepository.create(dto);
        return this.planRepository.save(plan);
    }
    async updatePlan(id, dto) {
        await this.planRepository.update(id, dto);
        return this.findPlanById(id);
    }
    async deletePlan(id) {
        const plan = await this.findPlanById(id);
        await this.planRepository.remove(plan);
    }
    async findAllRoleConfigs() {
        return this.roleConfigRepository.find();
    }
    async updateRoleConfig(role, data) {
        await this.roleConfigRepository.update(role, data);
        return this.roleConfigRepository.findOneBy({ role });
    }
    async sendNotification(data) {
        return this.notificationsService.create(data);
    }
    async findAllBusinesses() {
        return this.businessRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['memberships'],
        });
    }
    async findBusinessById(id) {
        const business = await this.businessRepository.findOne({
            where: { id },
            relations: ['memberships'],
        });
        if (!business)
            throw new common_1.NotFoundException('Negocio no encontrado');
        return business;
    }
    async updateBusinessStatus(id, status) {
        await this.businessRepository.update(id, { status });
        return this.findBusinessById(id);
    }
    async updateBusinessSubscription(id, planId, expiresAt) {
        await this.businessRepository.update(id, {
            planId,
            subscriptionExpiresAt: expiresAt,
            status: 'ACTIVE'
        });
        return this.findBusinessById(id);
    }
    async registerPayment(id, months) {
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
    async findAllUsers() {
        return this.userRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async updateUserStatus(id, active) {
        await this.userRepository.update(id, { active });
        const user = await this.userRepository.findOneBy({ id });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return user;
    }
    async updateUserGlobalRole(id, role) {
        await this.userRepository.update(id, { globalRole: role });
        const user = await this.userRepository.findOneBy({ id });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return user;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(business_entity_1.Business)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(global_role_config_entity_1.GlobalRoleConfig)),
    __param(3, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map