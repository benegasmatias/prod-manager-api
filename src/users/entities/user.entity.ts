import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BusinessMembership } from '../../businesses/entities/business-membership.entity';

@Entity('users')
export class User {
    @PrimaryColumn('uuid')
    id: string; // Este será el 'sub' de Supabase Auth

    @Column({ unique: true })
    email: string;

    @Column({ name: 'full_name', nullable: true })
    fullName: string;

    @Column({ name: 'default_business_id', nullable: true, type: 'uuid' })
    defaultBusinessId: string;

    @Column({ name: 'global_role', default: 'USER' })
    globalRole: string; // From UserRole enum: SUPER_ADMIN, USER

    @Column({ default: 'PENDING' })
    status: string; // From UserStatus enum: PENDING, ACTIVE, BLOCKED

    @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
    approvedAt: Date;

    @Column({ name: 'approved_by', nullable: true, type: 'uuid' })
    approvedBy: string;

    @Column({ name: 'active', default: true })
    active: boolean; // Keep for legacy/soft delete if needed

    @Column({ default: 'FREE' })
    plan: string;

    @Column({ name: 'must_change_password', default: false })
    mustChangePassword: boolean;

    @Column({ name: 'terms_accepted', default: false })
    termsAccepted: boolean;

    @Column({ type: 'timestamp', name: 'terms_accepted_at', nullable: true })
    termsAcceptedAt: Date;

    @OneToMany(() => BusinessMembership, (membership) => membership.user)
    memberships: BusinessMembership[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
