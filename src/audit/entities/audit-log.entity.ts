import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
    BUSINESS_ACTIVATED = 'BUSINESS_ACTIVATED',
    BUSINESS_STATUS_CHANGED = 'BUSINESS_STATUS_CHANGED',
    BUSINESS_ENABLED_CHANGED = 'BUSINESS_ENABLED_CHANGED',
    BUSINESS_ARCHIVED = 'BUSINESS_ARCHIVED',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    RESOURCE_CREATED = 'RESOURCE_CREATED',
}

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'entity_type' })
    entityType: string;

    @Column({ name: 'entity_id' })
    entityId: string;

    @Column()
    action: string;

    @Column({ name: 'actor_user_id', nullable: true })
    actorUserId: string;

    @Index()
    @Column({ name: 'business_id', nullable: true })
    businessId: string;

    @Column({ type: 'jsonb', default: {} })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
