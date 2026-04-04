import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';
import { WebhookStatus } from '../../common/enums';

@Entity('webhook_events')
@Index(['provider', 'providerEventId'], { unique: true })
export class WebhookEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'provider_event_id', type: 'varchar', length: 255 })
    providerEventId: string;

    @Column({ type: 'varchar', length: 50 })
    provider: string; // STRIPE, MERCADOPAGO

    @Column({ name: 'event_type', type: 'varchar', length: 100 })
    eventType: string;

    @Column({
        type: 'enum',
        enum: WebhookStatus,
        default: WebhookStatus.RECEIVED
    })
    status: WebhookStatus;

    @Column({ name: 'business_id', type: 'uuid', nullable: true })
    businessId: string;

    @Column({ type: 'jsonb', nullable: true })
    payload: any;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string;

    @CreateDateColumn({ name: 'received_at' })
    receivedAt: Date;

    @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
    processedAt: Date;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'business_id' })
    business: Business;
}
