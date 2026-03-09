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
var SubscriptionReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionReminderService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const business_entity_1 = require("../../businesses/entities/business.entity");
const notifications_service_1 = require("../../notifications/notifications.service");
const notification_entity_1 = require("../../notifications/entities/notification.entity");
let SubscriptionReminderService = SubscriptionReminderService_1 = class SubscriptionReminderService {
    constructor(businessRepository, notificationsService) {
        this.businessRepository = businessRepository;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(SubscriptionReminderService_1.name);
    }
    async checkExpiringSubscriptions() {
        this.logger.log('Iniciando chequeo de suscripciones por vencer...');
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const today = new Date();
        const expiringSoon = await this.businessRepository.find({
            where: {
                subscriptionExpiresAt: (0, typeorm_2.MoreThan)(today) && (0, typeorm_2.LessThanOrEqual)(threeDaysFromNow),
                status: 'ACTIVE'
            }
        });
        this.logger.log(`Encontrados ${expiringSoon.length} negocios con vencimiento próximo.`);
        for (const business of expiringSoon) {
            await this.notificationsService.create({
                businessId: business.id,
                targetType: notification_entity_1.NotificationTargetType.BUSINESS,
                type: notification_entity_1.NotificationType.WARNING,
                title: 'Suscripción por Vencer',
                message: `Tu suscripción de "${business.name}" vence en menos de 3 días. Renueva ahora para evitar interrupciones.`,
                actionUrl: '/configuracion/suscripcion',
                actionLabel: 'Renovar Plan'
            });
            this.logger.log(`Notificación enviada a negocio: ${business.name}`);
        }
    }
};
exports.SubscriptionReminderService = SubscriptionReminderService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionReminderService.prototype, "checkExpiringSubscriptions", null);
exports.SubscriptionReminderService = SubscriptionReminderService = SubscriptionReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(business_entity_1.Business)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], SubscriptionReminderService);
//# sourceMappingURL=subscription-reminder.service.js.map