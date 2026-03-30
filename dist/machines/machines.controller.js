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
exports.MachinesController = void 0;
const common_1 = require("@nestjs/common");
const machines_service_1 = require("./machines.service");
const enums_1 = require("../common/enums");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const create_machine_dto_1 = require("./dto/create-machine.dto");
const update_machine_dto_1 = require("./dto/update-machine.dto");
let MachinesController = class MachinesController {
    constructor(printersService) {
        this.printersService = printersService;
    }
    async create(createDto) {
        return this.printersService.create(createDto);
    }
    async findAll(businessId, onlyActive, page = '1', pageSize = '50') {
        const active = onlyActive === 'false' ? false : true;
        return this.printersService.findAll(businessId, active, Number(page), Number(pageSize));
    }
    async findOne(id, businessId) {
        return this.printersService.findOne(id, businessId);
    }
    async update(id, updateDto, businessId) {
        return this.printersService.update(id, updateDto, businessId);
    }
    async updateStatus(id, status, businessId) {
        return this.printersService.updateStatus(id, status, businessId);
    }
    async assignOrder(id, orderId, materialId, metadata, businessId) {
        return this.printersService.assignOrder(id, orderId, materialId, businessId, metadata);
    }
    async release(id, businessId) {
        return this.printersService.release(id, businessId);
    }
    async remove(id, businessId) {
        return this.printersService.deactivate(id, businessId);
    }
};
exports.MachinesController = MachinesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_machine_dto_1.CreateMachineDto]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('businessId')),
    __param(1, (0, common_1.Query)('onlyActive')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_machine_dto_1.UpdateMachineDto, String]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/assign-order'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('orderId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)('materialId')),
    __param(3, (0, common_1.Body)('metadata')),
    __param(4, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, String]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "assignOrder", null);
__decorate([
    (0, common_1.Post)(':id/release'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "release", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MachinesController.prototype, "remove", null);
exports.MachinesController = MachinesController = __decorate([
    (0, common_1.Controller)('machines'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [machines_service_1.MachinesService])
], MachinesController);
//# sourceMappingURL=machines.controller.js.map