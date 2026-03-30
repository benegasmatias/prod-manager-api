import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Business } from '../../businesses/entities/business.entity';

export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

export enum NotificationTargetType {
    GLOBAL = 'global',
    BUSINESS = 'business',
    ROLE = 'role',
    USER = 'user'
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id', nullable: true })
    businessId: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.INFO
    })
    type: NotificationType;

    @Column({
        type: 'enum',
        enum: NotificationTargetType,
        default: NotificationTargetType.BUSINESS,
        name: 'target_type'
    })
    targetType: NotificationTargetType;

    @Column({ name: 'target_role', nullable: true })
    targetRole: string;

    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    @Column({ name: 'read_at', nullable: true })
    readAt: Date;

    @Column({ name: 'action_url', nullable: true })
    actionUrl: string;

    @Column({ name: 'action_label', nullable: true })
    actionLabel: string;

    @Column({ name: 'created_by_id', nullable: true })
    createdById: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
