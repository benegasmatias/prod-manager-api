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
exports.AuditLog = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
var AuditAction;
(function (AuditAction) {
    AuditAction["BUSINESS_ACTIVATED"] = "BUSINESS_ACTIVATED";
    AuditAction["BUSINESS_STATUS_CHANGED"] = "BUSINESS_STATUS_CHANGED";
    AuditAction["BUSINESS_ENABLED_CHANGED"] = "BUSINESS_ENABLED_CHANGED";
    AuditAction["BUSINESS_ARCHIVED"] = "BUSINESS_ARCHIVED";
    AuditAction["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    AuditAction["RESOURCE_CREATED"] = "RESOURCE_CREATED";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditLog = class AuditLog {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type' }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id' }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_user_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "actorUserId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'business_id', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs')
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map