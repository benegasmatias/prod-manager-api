import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification, NotificationTargetType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) { }

    async findAllForUser(user: User, businessId?: string): Promise<Notification[]> {
        const query = this.notificationRepository.createQueryBuilder('n')
            .where('(n.targetType = :global)', { global: NotificationTargetType.GLOBAL })
            .orWhere('(n.targetType = :user AND n.userId = :userId)', { user: NotificationTargetType.USER, userId: user.id })
            .orWhere('(n.targetType = :role AND n.targetRole = :roleName)', { role: NotificationTargetType.ROLE, roleName: user.globalRole });


        if (businessId) {
            query.orWhere('(n.targetType = :business AND n.businessId = :businessId)', { business: NotificationTargetType.BUSINESS, businessId });
        }

        return query
            .orderBy('n.created_at', 'DESC')
            .limit(50)
            .getMany();
    }

    async getUnreadCount(user: User, businessId?: string): Promise<number> {
        const query = this.notificationRepository.createQueryBuilder('n')
            .where('n.isRead = false')
            .andWhere(
                '(n.targetType = :global OR (n.targetType = :user AND n.userId = :userId) OR (n.targetType = :role AND n.targetRole = :roleName)' +
                (businessId ? ' OR (n.targetType = :business AND n.businessId = :businessId)' : '') +
                ')',
                { global: NotificationTargetType.GLOBAL, user: NotificationTargetType.USER, userId: user.id, businessId, role: NotificationTargetType.ROLE, roleName: user.globalRole, business: NotificationTargetType.BUSINESS }
            );

        return query.getCount();
    }

    async markAsRead(id: string, userId: string): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({ where: { id } });
        if (!notification) throw new NotFoundException('Notificación no encontrada');

        // Note: For global or business wide notifications, we might need a separate table to track read status per user
        // But for simplicity and based on requirements, we mark it as read on the notification itself if it's user-specific,
        // or we imply it's "read by this specific user" if we had a many-to-many.
        // Given current structure, we'll just update isRead.

        await this.notificationRepository.update(id, {
            isRead: true,
            readAt: new Date()
        });

        return this.notificationRepository.findOne({ where: { id } });
    }

    async markAllAsRead(user: User, businessId?: string): Promise<void> {
        const query = this.notificationRepository.createQueryBuilder()
            .update(Notification)
            .set({ isRead: true, readAt: new Date() })
            .where('isRead = false')
            .andWhere(
                '(targetType = :global OR (targetType = :user AND userId = :userId) OR (targetType = :role AND targetRole = :roleName)' +
                (businessId ? ' OR (targetType = :business AND businessId = :businessId)' : '') +
                ')',
                { global: NotificationTargetType.GLOBAL, user: NotificationTargetType.USER, userId: user.id, businessId, role: NotificationTargetType.ROLE, roleName: user.globalRole, business: NotificationTargetType.BUSINESS }
            );

        await query.execute();
    }

    async create(data: Partial<Notification>): Promise<Notification> {
        const notification = this.notificationRepository.create(data);
        return this.notificationRepository.save(notification);
    }

    async remove(id: string): Promise<void> {
        await this.notificationRepository.delete(id);
    }

    async removeAllForUser(user: User, businessId?: string): Promise<void> {
        const query = this.notificationRepository.createQueryBuilder()
            .delete()
            .from(Notification)
            .where(
                '(targetType = :global OR (targetType = :user AND userId = :userId) OR (targetType = :role AND targetRole = :roleName)' +
                (businessId ? ' OR (targetType = :business AND businessId = :businessId)' : '') +
                ')',
                { global: NotificationTargetType.GLOBAL, user: NotificationTargetType.USER, userId: user.id, businessId, role: NotificationTargetType.ROLE, roleName: user.globalRole, business: NotificationTargetType.BUSINESS }
            );

        await query.execute();
    }
}


