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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const customers_service_1 = require("./customers.service");
const customer_dto_1 = require("./dto/customer.dto");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const business_access_guard_1 = require("../businesses/guards/business-access.guard");
const business_status_guard_1 = require("../businesses/guards/business-status.guard");
const allow_business_statuses_decorator_1 = require("../businesses/decorators/allow-business-statuses.decorator");
const enums_1 = require("../common/enums");
let CustomersController = class CustomersController {
    constructor(customersService) {
        this.customersService = customersService;
    }
    async create(req, createCustomerDto) {
        return this.customersService.create(createCustomerDto);
    }
    async findAll(req, businessId, q, page, limit) {
        if (!businessId) {
            throw new common_1.BadRequestException('El ID del negocio es obligatorio');
        }
        return this.customersService.findAll(businessId, q, Number(page) || 1, Number(limit) || 10);
    }
    async findOne(id) {
        return this.customersService.findOne(id);
    }
    async update(req, id, updateCustomerDto) {
        return this.customersService.update(id, updateCustomerDto);
    }
    async remove(req, id) {
        return this.customersService.remove(id);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(business_access_guard_1.BusinessAccessGuard, business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('businessId')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, customer_dto_1.UpdateCustomerDto]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CustomersController.prototype, "remove", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map