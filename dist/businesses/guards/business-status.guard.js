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
exports.BusinessStatusGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const enums_1 = require("../../common/enums");
const businesses_service_1 = require("../businesses.service");
const allow_business_statuses_decorator_1 = require("../decorators/allow-business-statuses.decorator");
const business_request_utils_1 = require("../utils/business-request.utils");
let BusinessStatusGuard = class BusinessStatusGuard {
    constructor(reflector, businessesService) {
        this.reflector = reflector;
        this.businessesService = businessesService;
    }
    async canActivate(context) {
        const requiredStatuses = this.reflector.getAllAndOverride(allow_business_statuses_decorator_1.BUSINESS_STATUSES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredStatuses) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const businessId = (0, business_request_utils_1.getBusinessIdFromRequest)(request);
        if (!businessId) {
            return true;
        }
        const business = await this.businessesService.findOne(request.user.id, businessId);
        if (!business) {
            return true;
        }
        if (!business.isEnabled) {
            throw new common_1.ForbiddenException({
                statusCode: 403,
                message: 'El acceso a este negocio ha sido deshabilitado administrativamente.',
                errorCode: 'BUSINESS_DISABLED',
                businessId: business.id,
            });
        }
        const currentStatus = business.status;
        if (!requiredStatuses.includes(currentStatus)) {
            const errorMsg = this.getErrorMessage(currentStatus);
            const errorCode = `BUSINESS_${currentStatus}`;
            throw new common_1.ForbiddenException({
                statusCode: 403,
                message: errorMsg,
                errorCode: errorCode,
                businessId: business.id,
            });
        }
        return true;
    }
    getErrorMessage(status) {
        switch (status) {
            case enums_1.BusinessStatus.DRAFT:
                return 'El negocio se encuentra en proceso de creación (Borrador). Debe activarse para operar.';
            case enums_1.BusinessStatus.SUSPENDED:
                return 'El acceso al negocio ha sido suspendido administrativa o por falta de pago.';
            case enums_1.BusinessStatus.ARCHIVED:
                return 'El negocio se encuentra en el archivo y no puede procesar operaciones.';
            default:
                return `Estado de negocio (${status}) no permitido para esta operación.`;
        }
    }
};
exports.BusinessStatusGuard = BusinessStatusGuard;
exports.BusinessStatusGuard = BusinessStatusGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        businesses_service_1.BusinessesService])
], BusinessStatusGuard);
//# sourceMappingURL=business-status.guard.js.map