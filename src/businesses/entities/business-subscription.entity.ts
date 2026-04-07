import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Business } from './business.entity';
import { SubscriptionStatus } from '../../common/enums';

@Entity('business_subscriptions')
export class BusinessSubscription {
    @PrimaryColumn({ name: 'business_id', type: 'uuid' })
    businessId: string;

    @OneToOne(() => Business, (business) => business.subscription, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ type: 'varchar', length: 50 })
    plan: string; // FREE, PRO, ENTERPRISE

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE // Default para migración inicial
    })
    status: SubscriptionStatus;

    @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
    currentPeriodStart: Date;

    @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
    currentPeriodEnd: Date;

    @Column({ name: 'trial_end_at', type: 'timestamp', nullable: true })
    trialEndAt: Date;

    @Column({ name: 'grace_period_end_at', type: 'timestamp', nullable: true })
    gracePeriodEndAt: Date;

    @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
    cancelAtPeriodEnd: boolean;

    // Pasarela de Pagos
    @Column({ type: 'varchar', length: 50, nullable: true })
    provider: string; // STRIPE, MERCADOPAGO

    @Column({ name: 'provider_subscription_id', type: 'varchar', length: 255, nullable: true })
    providerSubscriptionId: string;

    @Column({ name: 'provider_customer_id', type: 'varchar', length: 255, nullable: true })
    providerCustomerId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
