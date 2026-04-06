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
exports.Business = void 0;
const typeorm_1 = require("typeorm");
const business_membership_entity_1 = require("./business-membership.entity");
const business_subscription_entity_1 = require("./business-subscription.entity");
let Business = class Business {
};
exports.Business = Business;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Business.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Business.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "taxId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'GENERICO' }),
    __metadata("design:type", String)
], Business.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'ARS' }),
    __metadata("design:type", String)
], Business.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'DRAFT' }),
    __metadata("design:type", String)
], Business.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'trial_expires_at', nullable: true }),
    __metadata("design:type", Date)
], Business.prototype, "trialExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'subscription_expires_at', nullable: true }),
    __metadata("design:type", Date)
], Business.prototype, "subscriptionExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_enabled', default: true }),
    __metadata("design:type", Boolean)
], Business.prototype, "isEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_reason_code', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "statusReasonCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_reason_text', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "statusReasonText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Business.prototype, "statusUpdatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'FREE' }),
    __metadata("design:type", String)
], Business.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accepting_orders', default: true }),
    __metadata("design:type", Boolean)
], Business.prototype, "acceptingOrders", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'onboarding_completed', default: false }),
    __metadata("design:type", Boolean)
], Business.prototype, "onboardingCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'onboarding_step', default: 'BASIC_INFO' }),
    __metadata("design:type", String)
], Business.prototype, "onboardingStep", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'capabilities_override', nullable: true }),
    __metadata("design:type", Object)
], Business.prototype, "capabilitiesOverride", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Business.prototype, "adminNotes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => business_membership_entity_1.BusinessMembership, (membership) => membership.business),
    __metadata("design:type", Array)
], Business.prototype, "memberships", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => business_subscription_entity_1.BusinessSubscription, (sub) => sub.business),
    __metadata("design:type", business_subscription_entity_1.BusinessSubscription)
], Business.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Business.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Business.prototype, "updatedAt", void 0);
exports.Business = Business = __decorate([
    (0, typeorm_1.Entity)('businesses')
], Business);
//# sourceMappingURL=business.entity.js.map