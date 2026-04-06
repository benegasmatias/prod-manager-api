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
exports.BusinessRoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const business_membership_entity_1 = require("../entities/business-membership.entity");
const require_business_role_decorator_1 = require("../decorators/require-business-role.decorator");
const business_request_utils_1 = require("../utils/business-request.utils");
let BusinessRoleGuard = class BusinessRoleGuard {
    constructor(reflector, membershipRepository) {
        this.reflector = reflector;
        this.membershipRepository = membershipRepository;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(require_business_role_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();
        const businessId = (0, business_request_utils_1.getBusinessIdFromRequest)(request);
        const userId = request.user?.id;
        if (!businessId || !userId) {
            if (requiredRoles && requiredRoles.length > 0) {
                throw new common_1.ForbiddenException('Negocio o usuario no identificado para validación de roles.');
            }
            return true;
        }
        const membership = await this.membershipRepository.findOne({
            where: { userId, businessId }
        });
        if (!membership) {
            if (requiredRoles && requiredRoles.length > 0) {
                throw new common_1.ForbiddenException('No tienes una membresía activa en este negocio.');
            }
            return true;
        }
        request.businessRole = membership.role;
        if (requiredRoles && requiredRoles.length > 0) {
            const hasRole = requiredRoles.includes(membership.role);
            if (!hasRole) {
                throw new common_1.ForbiddenException(`Nivel insuficiente. Se requiere uno de los roles: ${requiredRoles.join(', ')}. Tu rol actual es: ${membership.role}`);
            }
        }
        return true;
    }
};
exports.BusinessRoleGuard = BusinessRoleGuard;
exports.BusinessRoleGuard = BusinessRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(business_membership_entity_1.BusinessMembership)),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository])
], BusinessRoleGuard);
//# sourceMappingURL=business-role.guard.js.map