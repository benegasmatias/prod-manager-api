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
exports.BusinessSubscription = void 0;
const typeorm_1 = require("typeorm");
const business_entity_1 = require("./business.entity");
const enums_1 = require("../../common/enums");
let BusinessSubscription = class BusinessSubscription {
};
exports.BusinessSubscription = BusinessSubscription;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'business_id', type: 'uuid' }),
    __metadata("design:type", String)
], BusinessSubscription.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => business_entity_1.Business, (business) => business.subscription),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", business_entity_1.Business)
], BusinessSubscription.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], BusinessSubscription.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.SubscriptionStatus,
        default: enums_1.SubscriptionStatus.ACTIVE
    }),
    __metadata("design:type", String)
], BusinessSubscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_period_start', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BusinessSubscription.prototype, "currentPeriodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_period_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BusinessSubscription.prototype, "currentPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trial_end_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BusinessSubscription.prototype, "trialEndAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grace_period_end_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BusinessSubscription.prototype, "gracePeriodEndAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancel_at_period_end', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], BusinessSubscription.prototype, "cancelAtPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], BusinessSubscription.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provider_subscription_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], BusinessSubscription.prototype, "providerSubscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provider_customer_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], BusinessSubscription.prototype, "providerCustomerId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BusinessSubscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BusinessSubscription.prototype, "updatedAt", void 0);
exports.BusinessSubscription = BusinessSubscription = __decorate([
    (0, typeorm_1.Entity)('business_subscriptions')
], BusinessSubscription);
//# sourceMappingURL=business-subscription.entity.js.map