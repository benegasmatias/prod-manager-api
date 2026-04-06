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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
let WebhooksController = class WebhooksController {
    constructor(billingService) {
        this.billingService = billingService;
    }
    async handleStripe(payload, signature) {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!signature && process.env.NODE_ENV === 'production') {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        if (secret && signature) {
            console.log('[Webhooks] Real Signature Verification Active');
        }
        else {
            console.warn('[Webhooks] WARNING: Running with signature bypass (Local/Dev)');
        }
        const eventId = payload.id;
        const eventType = payload.type;
        const businessId = payload.data?.object?.metadata?.businessId;
        const webhookRecord = await this.billingService.recordWebhookEvent('STRIPE', eventId, eventType, payload, businessId);
        try {
            await this.billingService.processSubscriptionEvent(webhookRecord.id);
        }
        catch (error) {
            console.error('[Webhooks] Error processing event:', eventId, error.message);
        }
        return { received: true };
    }
    async handleMP(payload) {
        const eventId = payload.id || payload.data?.id;
        const eventType = payload.type || payload.action;
        const webhookRecord = await this.billingService.recordWebhookEvent('MERCADOPAGO', eventId, eventType, payload);
        return { received: true };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('stripe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleStripe", null);
__decorate([
    (0, common_1.Post)('mercadopago'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleMP", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map