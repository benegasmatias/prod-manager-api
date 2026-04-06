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
exports.BusinessSubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const plan_usage_service_1 = require("./plan-usage.service");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const business_access_guard_1 = require("./guards/business-access.guard");
const business_role_guard_1 = require("./guards/business-role.guard");
const require_business_role_decorator_1 = require("./decorators/require-business-role.decorator");
const enums_1 = require("../common/enums");
let BusinessSubscriptionController = class BusinessSubscriptionController {
    constructor(billingService, planUsageService) {
        this.billingService = billingService;
        this.planUsageService = planUsageService;
    }
    async getSubscription(id) {
        return this.planUsageService.getBusinessUsage(id);
    }
    async preflight(id, plan) {
        if (!plan)
            throw new common_1.BadRequestException('Se requiere plan para preflight');
        return this.billingService.preflightCheck(id, plan);
    }
    async changePlan(id, plan, req) {
        if (!plan)
            throw new common_1.BadRequestException('Se requiere plan');
        return this.billingService.changePlan(id, plan, req.user.id);
    }
    async sync(id) {
        const usage = await this.planUsageService.getBusinessUsage(id);
        const status = usage.status;
        await this.billingService.syncBusinessStatusFromSubscription(id, status);
        return { message: 'Sync OK', status };
    }
};
exports.BusinessSubscriptionController = BusinessSubscriptionController;
__decorate([
    (0, common_1.Get)(),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessSubscriptionController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Get)('preflight'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('plan')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BusinessSubscriptionController.prototype, "preflight", null);
__decorate([
    (0, common_1.Patch)('plan'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('plan')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BusinessSubscriptionController.prototype, "changePlan", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BusinessSubscriptionController.prototype, "sync", null);
exports.BusinessSubscriptionController = BusinessSubscriptionController = __decorate([
    (0, common_1.Controller)('businesses/:id/subscription'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        plan_usage_service_1.PlanUsageService])
], BusinessSubscriptionController);
//# sourceMappingURL=business-subscription.controller.js.map