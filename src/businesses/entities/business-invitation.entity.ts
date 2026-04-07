import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Business } from './business.entity';
import { User } from '../../users/entities/user.entity';

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}

@Entity('business_invitations')
export class BusinessInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column()
    email: string;

    @Column()
    role: string; // OWNER, ADMIN, MEMBER, OPERATOR

    @Column({ name: 'invited_by_user_id' })
    invitedByUserId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'invited_by_user_id' })
    invitedByUser: User;

    @Column({ unique: true })
    token: string;

    @Column({
        type: 'enum',
        enum: InvitationStatus,
        default: InvitationStatus.PENDING
    })
    status: InvitationStatus;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
    acceptedAt: Date;

    @Column({ name: 'accepted_by_user_id', nullable: true })
    acceptedByUserId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'accepted_by_user_id' })
    acceptedByUser: User;

    @Column({ name: 'first_name', nullable: true })
    firstName: string;

    @Column({ name: 'last_name', nullable: true })
    lastName: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    specialty: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
