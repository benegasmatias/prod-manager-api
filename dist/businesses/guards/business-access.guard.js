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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const businesses_service_1 = require("../../businesses/businesses.service");
const business_request_utils_1 = require("../utils/business-request.utils");
let BusinessAccessGuard = class BusinessAccessGuard {
    constructor(businessesService) {
        this.businessesService = businessesService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const businessId = (0, business_request_utils_1.getBusinessIdFromRequest)(request);
        if (!businessId) {
            return true;
        }
        const hasAccess = await this.businessesService.checkAccess(request.user.id, businessId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('No tienes acceso a los datos de este negocio o el negocio no existe.');
        }
        return true;
    }
};
exports.BusinessAccessGuard = BusinessAccessGuard;
exports.BusinessAccessGuard = BusinessAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [businesses_service_1.BusinessesService])
], BusinessAccessGuard);
//# sourceMappingURL=business-access.guard.js.map