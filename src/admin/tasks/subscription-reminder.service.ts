import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationTargetType } from '../../notifications/entities/notification.entity';

@Injectable()
export class SubscriptionReminderService {
    private readonly logger = new Logger(SubscriptionReminderService.name);

    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        private readonly notificationsService: NotificationsService,
    ) { }

    // Corre todos los días a las 8:00 AM
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async checkExpiringSubscriptions() {
        this.logger.log('Iniciando chequeo de suscripciones por vencer...');

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const today = new Date();

        // Buscamos negocios que vencen exactamente en 3 días (o rango cercano)
        // Para simplificar, buscamos los que vencen entre hoy y dentro de 3 días que no hayan sido notificados
        // Nota: En una app real usaríamos un flag 'notifiedAt' para no spamear
        const expiringSoon = await this.businessRepository.find({
            where: {
                subscriptionExpiresAt: MoreThan(today) && LessThanOrEqual(threeDaysFromNow),
                status: 'ACTIVE'
            }
        });

        this.logger.log(`Encontrados ${expiringSoon.length} negocios con vencimiento próximo.`);

        for (const business of expiringSoon) {
            await this.notificationsService.create({
                businessId: business.id,
                targetType: NotificationTargetType.BUSINESS,
                type: NotificationType.WARNING,
                title: 'Suscripción por Vencer',
                message: `Tu suscripción de "${business.name}" vence en menos de 3 días. Renueva ahora para evitar interrupciones.`,
                actionUrl: '/configuracion/suscripcion',
                actionLabel: 'Renovar Plan'
            });
            this.logger.log(`Notificación enviada a negocio: ${business.name}`);
        }
    }
}
