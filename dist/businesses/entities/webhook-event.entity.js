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
exports.WebhookEvent = void 0;
const typeorm_1 = require("typeorm");
const business_entity_1 = require("./business.entity");
const enums_1 = require("../../common/enums");
let WebhookEvent = class WebhookEvent {
};
exports.WebhookEvent = WebhookEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WebhookEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provider_event_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "providerEventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.WebhookStatus,
        default: enums_1.WebhookStatus.RECEIVED
    }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WebhookEvent.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'received_at' }),
    __metadata("design:type", Date)
], WebhookEvent.prototype, "receivedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WebhookEvent.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => business_entity_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", business_entity_1.Business)
], WebhookEvent.prototype, "business", void 0);
exports.WebhookEvent = WebhookEvent = __decorate([
    (0, typeorm_1.Entity)('webhook_events'),
    (0, typeorm_1.Index)(['provider', 'providerEventId'], { unique: true })
], WebhookEvent);
//# sourceMappingURL=webhook-event.entity.js.map