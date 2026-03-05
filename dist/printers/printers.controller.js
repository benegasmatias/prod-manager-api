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
exports.PrintersController = void 0;
const common_1 = require("@nestjs/common");
const printers_service_1 = require("./printers.service");
const enums_1 = require("../common/enums");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
const create_printer_dto_1 = require("./dto/create-printer.dto");
let PrintersController = class PrintersController {
    constructor(printersService) {
        this.printersService = printersService;
    }
    async create(createPrinterDto) {
        return this.printersService.create(createPrinterDto);
    }
    async findAll(businessId) {
        return this.printersService.findAll(businessId);
    }
    async findOne(id) {
        return this.printersService.findOne(id);
    }
    async updateStatus(id, status) {
        return this.printersService.updateStatus(id, status);
    }
    async assignOrder(id, orderId) {
        return this.printersService.assignOrder(id, orderId);
    }
    async release(id) {
        return this.printersService.release(id);
    }
};
exports.PrintersController = PrintersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_printer_dto_1.CreatePrinterDto]),
    __metadata("design:returntype", Promise)
], PrintersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrintersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrintersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PrintersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/assign-order'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('orderId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PrintersController.prototype, "assignOrder", null);
__decorate([
    (0, common_1.Post)(':id/release'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrintersController.prototype, "release", null);
exports.PrintersController = PrintersController = __decorate([
    (0, common_1.Controller)('printers'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [printers_service_1.PrintersService])
], PrintersController);
//# sourceMappingURL=printers.controller.js.map