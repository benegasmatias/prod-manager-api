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
exports.PlanUsageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const business_entity_1 = require("./entities/business.entity");
const user_entity_1 = require("../users/entities/user.entity");
const machine_entity_1 = require("../machines/entities/machine.entity");
const employee_entity_1 = require("../employees/entities/employee.entity");
const plan_limits_config_1 = require("./config/plan-limits.config");
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const business_subscription_entity_1 = require("./entities/business-subscription.entity");
let PlanUsageService = class PlanUsageService {
    constructor(businessRepository, userRepository, machineRepository, employeeRepository, subscriptionRepository, auditService) {
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
        this.machineRepository = machineRepository;
        this.employeeRepository = employeeRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.auditService = auditService;
    }
    async ensureBusinessCreationAllowed(userId) {
        const user = await this.userRepository.findOneBy({ id: userId });
        const userPlan = user?.plan || 'FREE';
        const limits = plan_limits_config_1.PLAN_LIMITS[userPlan];
        const businessCount = await this.businessRepository.countBy({
            memberships: { userId }
        });
        if (businessCount >= limits.maxBusinessesPerUser) {
            await this.auditService.log(audit_log_entity_1.AuditAction.QUOTA_EXCEEDED, 'USER', userId, null, userId, { resource: 'BUSINESSES', usage: businessCount, limit: limits.maxBusinessesPerUser, plan: userPlan });
            this.throwQuotaException('BUSINESSES', userPlan, limits.maxBusinessesPerUser, businessCount);
        }
    }
    async ensureMachineCreationAllowed(businessId) {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = plan_limits_config_1.PLAN_LIMITS[plan];
        const machineCount = await this.machineRepository.countBy({ businessId, active: true });
        if (machineCount >= limits.maxMachinesPerBusiness) {
            await this.auditService.log(audit_log_entity_1.AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, { resource: 'MACHINES', usage: machineCount, limit: limits.maxMachinesPerBusiness, plan });
            this.throwQuotaException('MACHINES', plan, limits.maxMachinesPerBusiness, machineCount);
        }
    }
    async ensureEmployeeCreationAllowed(businessId) {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const limits = plan_limits_config_1.PLAN_LIMITS[plan];
        const employeeCount = await this.employeeRepository.countBy({ businessId, active: true });
        if (employeeCount >= limits.maxEmployeesPerBusiness) {
            await this.auditService.log(audit_log_entity_1.AuditAction.QUOTA_EXCEEDED, 'BUSINESS', businessId, businessId, null, { resource: 'EMPLOYEES', usage: employeeCount, limit: limits.maxEmployeesPerBusiness, plan });
            this.throwQuotaException('EMPLOYEES', plan, limits.maxEmployeesPerBusiness, employeeCount);
        }
    }
    async getBusinessUsage(businessId) {
        const business = await this.businessRepository.findOne({
            where: { id: businessId },
            relations: ['subscription']
        });
        const plan = business?.subscription?.plan || business?.plan || 'FREE';
        const status = business?.subscription?.status || 'ACTIVE';
        const limits = plan_limits_config_1.PLAN_LIMITS[plan];
        const [machines, employees] = await Promise.all([
            this.machineRepository.countBy({ businessId, active: true }),
            this.employeeRepository.countBy({ businessId, active: true }),
        ]);
        return {
            plan,
            status,
            limits,
            usage: {
                MACHINES: machines,
                EMPLOYEES: employees,
            },
            remaining: {
                MACHINES: limits.maxMachinesPerBusiness - machines,
                EMPLOYEES: limits.maxEmployeesPerBusiness - employees,
            }
        };
    }
    throwQuotaException(resource, plan, limit, usage) {
        const suggestedPlan = plan === 'FREE' ? 'PRO' : 'ENTERPRISE';
        throw new common_1.ForbiddenException({
            statusCode: 403,
            message: `Límite excedido para ${resource} en plan ${plan}. (${usage}/${limit})`,
            errorCode: 'QUOTA_EXCEEDED',
            metadata: {
                resource,
                plan,
                limit,
                usage,
                remaining: 0,
                suggestedPlan
            }
        });
    }
};
exports.PlanUsageService = PlanUsageService;
exports.PlanUsageService = PlanUsageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(business_entity_1.Business)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __param(3, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(4, (0, typeorm_1.InjectRepository)(business_subscription_entity_1.BusinessSubscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], PlanUsageService);
//# sourceMappingURL=plan-usage.service.js.map