import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { BusinessSubscription } from '../../businesses/entities/business-subscription.entity';
import { BillingService } from '../../businesses/billing.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationTargetType } from '../../notifications/entities/notification.entity';

@Injectable()
export class SubscriptionReminderService {
    private readonly logger = new Logger(SubscriptionReminderService.name);

    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(BusinessSubscription)
        private readonly subscriptionRepository: Repository<BusinessSubscription>,
        private readonly billingService: BillingService,
        private readonly notificationsService: NotificationsService,
    ) { }

    // Corre todos los días a las 8:00 AM
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async checkExpiringSubscriptions() {
        this.logger.log('Iniciando chequeo de suscripciones y renovaciones...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);

        const oneDayFromNow = new Date(today);
        oneDayFromNow.setDate(today.getDate() + 1);

        // 1. NOTIFICACIONES DE VENCIMIENTO PRÓXIMO
        const expiringSoon = await this.subscriptionRepository.createQueryBuilder('sub')
            .innerJoinAndSelect('sub.business', 'business')
            .where('sub.currentPeriodEnd IS NOT NULL')
            .andWhere('sub.status = :active', { active: 'ACTIVE' })
            .andWhere('sub.currentPeriodEnd > :today', { today })
            .andWhere('sub.currentPeriodEnd <= :threeDays', { threeDays: threeDaysFromNow })
            .getMany();

        for (const sub of expiringSoon) {
            const daysLeft = Math.ceil((sub.currentPeriodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            await this.notificationsService.create({
                businessId: sub.businessId,
                targetType: NotificationTargetType.BUSINESS,
                type: NotificationType.WARNING,
                title: 'Suscripción por Vencer',
                message: `Tu suscripción de "${sub.business.name}" vence en ${daysLeft} día(s). Renueva ahora para evitar interrupciones.`,
                actionUrl: '/billing/pricing',
                actionLabel: 'Ver Planes'
            });
        }

        // 2. PROCESO DE DOWNGRADE AUTOMÁTICO (Vencimiento Real)
        // Buscamos suscripciones que ya vencieron (currentPeriodEnd < hoy)
        const expired = await this.subscriptionRepository.createQueryBuilder('sub')
            .innerJoinAndSelect('sub.business', 'business')
            .where('sub.currentPeriodEnd IS NOT NULL')
            .andWhere('sub.plan NOT LIKE :free', { free: 'free%' }) 
            .andWhere('sub.currentPeriodEnd < :today', { today })
            .getMany();

        this.logger.log(`Procesando ${expired.length} suscripciones vencidas.`);

        for (const sub of expired) {
            // Si tiene periodo de gracia, respetarlo
            const graceEnd = sub.gracePeriodEndAt ? new Date(sub.gracePeriodEndAt) : sub.currentPeriodEnd;
            
            if (today > graceEnd) {
                // EXPIRO TOTALMENTE -> Downgrade a Free
                this.logger.log(`Downgrade automático para el negocio: ${sub.business.name}`);
                
                await this.billingService.downgradeToFree(sub.businessId);

                await this.notificationsService.create({
                    businessId: sub.businessId,
                    targetType: NotificationTargetType.BUSINESS,
                    type: NotificationType.INFO,
                    title: 'Suscripción Finalizada',
                    message: `Tu plan ha expirado y has sido movido al plan Gratuito. Algunos recursos podrían estar bloqueados por límites de cuota.`,
                    actionUrl: '/billing/pricing',
                    actionLabel: 'Ver Planes Pro'
                });
            } else {
                // En periodo de gracia -> Solo avisar
                await this.notificationsService.create({
                    businessId: sub.businessId,
                    targetType: NotificationTargetType.BUSINESS,
                    type: NotificationType.WARNING,
                    title: 'Suscripción Vencida',
                    message: `Tu suscripción de "${sub.business.name}" ha vencido. Tienes un periodo de gracia para regularizar el pago antes de ser degradado al plan gratuito.`,
                    actionUrl: '/billing/pricing',
                    actionLabel: 'Pagar Ahora'
                });
            }
        }
    }
}
