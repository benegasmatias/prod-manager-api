import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
    globalRole: string; // SUPER_ADMIN, ADMIN, SUPPORT, USER

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
