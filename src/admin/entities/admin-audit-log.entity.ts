import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('admin_audit_logs')
export class AdminAuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    operatorId: string; // The super-admin who performed the action

    @Column()
    action: string; // e.g., 'USER_APPROVED', 'BUSINESS_SUSPENDED'

    @Column()
    targetId: string; // The ID of the user or business affected

    @Column('jsonb', { nullable: true })
    details: any; // Additional context (old state, new state, reason)

    @CreateDateColumn()
    timestamp: Date;
}
