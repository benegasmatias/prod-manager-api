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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
let NotificationsService = class NotificationsService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async findAllForUser(user, businessId) {
        const query = this.notificationRepository.createQueryBuilder('n')
            .where('(n.targetType = :global)', { global: notification_entity_1.NotificationTargetType.GLOBAL })
            .orWhere('(n.targetType = :user AND n.userId = :userId)', { user: notification_entity_1.NotificationTargetType.USER, userId: user.id })
            .orWhere('(n.targetType = :role AND n.targetRole = :roleName)', { role: notification_entity_1.NotificationTargetType.ROLE, roleName: user.globalRole });
        if (businessId) {
            query.orWhere('(n.targetType = :business AND n.businessId = :businessId)', { business: notification_entity_1.NotificationTargetType.BUSINESS, businessId });
        }
        return query
            .orderBy('n.created_at', 'DESC')
            .limit(50)
            .getMany();
    }
    async getUnreadCount(user, businessId) {
        const query = this.notificationRepository.createQueryBuilder('n')
            .where('n.isRead = false')
            .andWhere('(n.targetType = :global OR (n.targetType = :user AND n.userId = :userId) OR (n.targetType = :role AND n.targetRole = :roleName)' +
            (businessId ? ' OR (n.targetType = :business AND n.businessId = :businessId)' : '') +
            ')', { global: notification_entity_1.NotificationTargetType.GLOBAL, user: notification_entity_1.NotificationTargetType.USER, userId: user.id, businessId, role: notification_entity_1.NotificationTargetType.ROLE, roleName: user.globalRole, business: notification_entity_1.NotificationTargetType.BUSINESS });
        return query.getCount();
    }
    async markAsRead(id, userId) {
        const notification = await this.notificationRepository.findOne({ where: { id } });
        if (!notification)
            throw new common_1.NotFoundException('Notificación no encontrada');
        await this.notificationRepository.update(id, {
            isRead: true,
            readAt: new Date()
        });
        return this.notificationRepository.findOne({ where: { id } });
    }
    async markAllAsRead(user, businessId) {
        const query = this.notificationRepository.createQueryBuilder()
            .update(notification_entity_1.Notification)
            .set({ isRead: true, readAt: new Date() })
            .where('isRead = false')
            .andWhere('(targetType = :global OR (targetType = :user AND userId = :userId) OR (targetType = :role AND targetRole = :roleName)' +
            (businessId ? ' OR (targetType = :business AND businessId = :businessId)' : '') +
            ')', { global: notification_entity_1.NotificationTargetType.GLOBAL, user: notification_entity_1.NotificationTargetType.USER, userId: user.id, businessId, role: notification_entity_1.NotificationTargetType.ROLE, roleName: user.globalRole, business: notification_entity_1.NotificationTargetType.BUSINESS });
        await query.execute();
    }
    async create(data) {
        const notification = this.notificationRepository.create(data);
        return this.notificationRepository.save(notification);
    }
    async remove(id) {
        await this.notificationRepository.delete(id);
    }
    async removeAllForUser(user, businessId) {
        const query = this.notificationRepository.createQueryBuilder()
            .delete()
            .from(notification_entity_1.Notification)
            .where('(targetType = :global OR (targetType = :user AND userId = :userId) OR (targetType = :role AND targetRole = :roleName)' +
            (businessId ? ' OR (targetType = :business AND businessId = :businessId)' : '') +
            ')', { global: notification_entity_1.NotificationTargetType.GLOBAL, user: notification_entity_1.NotificationTargetType.USER, userId: user.id, businessId, role: notification_entity_1.NotificationTargetType.ROLE, roleName: user.globalRole, business: notification_entity_1.NotificationTargetType.BUSINESS });
        await query.execute();
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map