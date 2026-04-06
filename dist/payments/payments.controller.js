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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const payment_dto_1 = require("./dto/payment.dto");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const business_access_guard_1 = require("../businesses/guards/business-access.guard");
const business_status_guard_1 = require("../businesses/guards/business-status.guard");
const business_role_guard_1 = require("../businesses/guards/business-role.guard");
const allow_business_statuses_decorator_1 = require("../businesses/decorators/allow-business-statuses.decorator");
const require_business_role_decorator_1 = require("../businesses/decorators/require-business-role.decorator");
const enums_1 = require("../common/enums");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    create(orderId, createPaymentDto) {
        return this.paymentsService.create(orderId, createPaymentDto);
    }
    findAll(orderId) {
        return this.paymentsService.findByOrder(orderId);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('orders/:id/payments'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map