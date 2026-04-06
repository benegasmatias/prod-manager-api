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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const order_dto_1 = require("./dto/order.dto");
const payment_dto_1 = require("../payments/dto/payment.dto");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const business_access_guard_1 = require("../businesses/guards/business-access.guard");
const business_status_guard_1 = require("../businesses/guards/business-status.guard");
const business_role_guard_1 = require("../businesses/guards/business-role.guard");
const allow_business_statuses_decorator_1 = require("../businesses/decorators/allow-business-statuses.decorator");
const require_business_role_decorator_1 = require("../businesses/decorators/require-business-role.decorator");
const enums_1 = require("../common/enums");
const financial_privacy_interceptor_1 = require("../common/interceptors/financial-privacy.interceptor");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async getSummary(businessId) {
        return this.ordersService.getSummaryStats(businessId);
    }
    async getBudgetSummary(businessId) {
        return this.ordersService.getBudgetSummaryStats(businessId);
    }
    async findListing(query) {
        return this.ordersService.findListing(query);
    }
    async findVisits(query) {
        return this.ordersService.findVisits(query);
    }
    async findQuotations(query) {
        return this.ordersService.findQuotations(query);
    }
    async findAll(query) {
        return this.ordersService.findAll(query);
    }
    async findOne(id) {
        return this.ordersService.findOne(id);
    }
    async create(createOrderDto) {
        return this.ordersService.create(createOrderDto);
    }
    async reportFailure(id, reportFailureDto, req) {
        return this.ordersService.reportFailure(id, reportFailureDto, req.user.id);
    }
    async addPayment(id, createPaymentDto) {
        return this.ordersService.addPayment(id, createPaymentDto);
    }
    async updateStatus(id, updateStatusDto, req) {
        return this.ordersService.updateStatus(id, updateStatusDto, req.user.id);
    }
    async updateProgress(orderId, itemId, updateProgressDto, req) {
        return this.ordersService.updateProgress(orderId, itemId, updateProgressDto, req.user.id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES),
    __param(0, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('budget-summary'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES),
    __param(0, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getBudgetSummary", null);
__decorate([
    (0, common_1.Get)('listing'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.FindOrdersDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findListing", null);
__decorate([
    (0, common_1.Get)('visits'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.FindVisitsDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findVisits", null);
__decorate([
    (0, common_1.Get)('quotations'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.FindQuotationsDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findQuotations", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.FindOrdersDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/fail'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES, enums_1.BusinessRole.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "reportFailure", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES, enums_1.BusinessRole.OPERATOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, order_dto_1.UpdateOrderStatusDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':orderId/items/:itemId/progress'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES, enums_1.BusinessRole.OPERATOR),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, order_dto_1.UpdateProgressDto, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateProgress", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, common_1.UseInterceptors)(financial_privacy_interceptor_1.FinancialPrivacyInterceptor),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map