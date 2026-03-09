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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async initAdmin(req) {
        return this.adminService.updateUserGlobalRole(req.user.id, 'SUPER_ADMIN');
    }
    checkGlobalAdmin(req) {
        const userRole = req.user?.globalRole;
        if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('No tienes permisos administrativos globales.');
        }
    }
    async getAllBusinesses(req) {
        this.checkGlobalAdmin(req);
        return this.adminService.findAllBusinesses();
    }
    async getBusiness(req, id) {
        this.checkGlobalAdmin(req);
        return this.adminService.findBusinessById(id);
    }
    async updateBusinessStatus(req, id, body) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateBusinessStatus(id, body.status);
    }
    async updateBusinessSubscription(req, id, body) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateBusinessSubscription(id, body.planId, new Date(body.expiresAt));
    }
    async registerPayment(req, id, body) {
        this.checkGlobalAdmin(req);
        return this.adminService.registerPayment(id, body.months || 1);
    }
    async getAllUsers(req) {
        this.checkGlobalAdmin(req);
        return this.adminService.findAllUsers();
    }
    async updateUserStatus(req, id, body) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateUserStatus(id, body.active);
    }
    async updateUserRole(req, id, body) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateUserGlobalRole(id, body.role);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Patch)('init'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "initAdmin", null);
__decorate([
    (0, common_1.Get)('businesses'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllBusinesses", null);
__decorate([
    (0, common_1.Get)('businesses/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBusiness", null);
__decorate([
    (0, common_1.Patch)('businesses/:id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateBusinessStatus", null);
__decorate([
    (0, common_1.Patch)('businesses/:id/subscription'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateBusinessSubscription", null);
__decorate([
    (0, common_1.Patch)('businesses/:id/payment'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "registerPayment", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRole", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map