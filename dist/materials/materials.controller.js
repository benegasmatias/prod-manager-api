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
exports.MaterialsController = void 0;
const common_1 = require("@nestjs/common");
const materials_service_1 = require("./materials.service");
const material_dto_1 = require("./dto/material.dto");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const business_access_guard_1 = require("../businesses/guards/business-access.guard");
const business_status_guard_1 = require("../businesses/guards/business-status.guard");
const business_role_guard_1 = require("../businesses/guards/business-role.guard");
const allow_business_statuses_decorator_1 = require("../businesses/decorators/allow-business-statuses.decorator");
const require_business_role_decorator_1 = require("../businesses/decorators/require-business-role.decorator");
const enums_1 = require("../common/enums");
let MaterialsController = class MaterialsController {
    constructor(materialsService) {
        this.materialsService = materialsService;
    }
    create(createMaterialDto) {
        return this.materialsService.create(createMaterialDto);
    }
    findAll(businessId) {
        return this.materialsService.findAll(businessId);
    }
    async findOne(id) {
        return this.materialsService.findOne(id);
    }
    async update(id, updateMaterialDto) {
        return this.materialsService.update(id, updateMaterialDto);
    }
    async remove(id) {
        return this.materialsService.deactivate(id);
    }
};
exports.MaterialsController = MaterialsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [material_dto_1.CreateMaterialDto]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaterialsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, material_dto_1.UpdateMaterialDto]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(business_status_guard_1.BusinessStatusGuard),
    (0, allow_business_statuses_decorator_1.AllowBusinessStatuses)(enums_1.BusinessStatus.ACTIVE),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "remove", null);
exports.MaterialsController = MaterialsController = __decorate([
    (0, common_1.Controller)('materials'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, business_access_guard_1.BusinessAccessGuard, business_role_guard_1.BusinessRoleGuard),
    __metadata("design:paramtypes", [materials_service_1.MaterialsService])
], MaterialsController);
//# sourceMappingURL=materials.controller.js.map