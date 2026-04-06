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
exports.BusinessesController = void 0;
const common_1 = require("@nestjs/common");
const financial_privacy_interceptor_1 = require("../common/interceptors/financial-privacy.interceptor");
const businesses_service_1 = require("./businesses.service");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const create_business_from_template_dto_1 = require("./dto/create-business-from-template.dto");
const update_business_dto_1 = require("./dto/update-business.dto");
const business_access_guard_1 = require("./guards/business-access.guard");
const business_status_guard_1 = require("./guards/business-status.guard");
const business_role_guard_1 = require("./guards/business-role.guard");
const allow_business_statuses_decorator_1 = require("./decorators/allow-business-statuses.decorator");
const require_business_role_decorator_1 = require("./decorators/require-business-role.decorator");
const enums_1 = require("../common/enums");
let BusinessesController = class BusinessesController {
    constructor(businessesService) {
        this.businessesService = businessesService;
    }
    async findAll(req, enabled, acceptingOrders, status) {
        if (status && !Object.values(enums_1.BusinessStatus).includes(status)) {
            throw new common_1.BadRequestException(`Estado inválido: ${status}. Permitidos: ${Object.values(enums_1.BusinessStatus).join(', ')}`);
        }
        const filters = {
            isEnabled: enabled === undefined ? undefined : enabled === 'true',
            acceptingOrders: acceptingOrders === undefined ? undefined : acceptingOrders === 'true',
            status: status
        };
        return this.businessesService.findUserBusinesses(req.user.id, filters);
    }
    async findOne(req, id) {
        return this.businessesService.findOne(req.user.id, id);
    }
    async getSummary(req, id) {
        return this.businessesService.getDashboardSummary(req.user.id, id);
    }
    async getConfig(req, id) {
        return this.businessesService.resolveBusinessConfig(req.user.id, id);
    }
    async testReload() {
        return { message: "RELOAD_SUCCESS_OK_v1", time: new Date().toISOString() };
    }
    async getTemplates(req) {
        return this.businessesService.getTemplates(req.user.id);
    }
    async getPlanUsage(id) {
        return this.businessesService.getBusinessUsage(id);
    }
    async updateStatusAdmin(id, body) {
        return this.businessesService.updateStatusAdmin(id, body.status, body.reasonCode, body.reasonText);
    }
    async updateEnabledAdmin(id, body) {
        return this.businessesService.updateEnabledAdmin(id, body.isEnabled, body.reasonCode, body.reasonText);
    }
    async getAuditTrace(id) {
        return this.businessesService.getBusinessAuditLogs(id);
    }
    async create(req, createDto) {
        return this.businessesService.createFromTemplate(req.user.id, createDto);
    }
    async update(req, id, updateDto) {
        return this.businessesService.update(req.user.id, id, updateDto);
    }
    async updateOnboarding(req, id, step) {
        return this.businessesService.updateOnboardingStep(req.user.id, id, step);
    }
    async activate(req, id) {
        return this.businessesService.activateBusiness(req.user.id, id);
    }
};
exports.BusinessesController = BusinessesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('enabled')),
    __param(2, (0, common_1.Query)('accepting_orders')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('/:id'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/dashboard-summary'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_status_guard_1.BusinessStatusGuard, business_role_guard_1.BusinessRoleGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, common_1.UseInterceptors)(financial_privacy_interceptor_1.FinancialPrivacyInterceptor),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(':id/config'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('test-reload'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "testReload", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)(':id/plan-usage'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getPlanUsage", null);
__decorate([
    (0, common_1.Patch)('admin/:id/status'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "updateStatusAdmin", null);
__decorate([
    (0, common_1.Patch)('admin/:id/enabled'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "updateEnabledAdmin", null);
__decorate([
    (0, common_1.Get)(':id/audit-trace'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "getAuditTrace", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_business_from_template_dto_1.CreateBusinessFromTemplateDto]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('/:id'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_business_dto_1.UpdateBusinessDto]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('/:id/onboarding'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('onboardingStep')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "updateOnboarding", null);
__decorate([
    (0, common_1.Post)('/:id/activate'),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BusinessesController.prototype, "activate", null);
exports.BusinessesController = BusinessesController = __decorate([
    (0, common_1.Controller)('businesses'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [businesses_service_1.BusinessesService])
], BusinessesController);
//# sourceMappingURL=businesses.controller.js.map