import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('global_role_configs')
export class GlobalRoleConfig {
    @PrimaryColumn()
    role: string; // SUPER_ADMIN, ADMIN, SUPPORT

    @Column()
    description: string;

    @Column({ type: 'jsonb', default: {} })
    capabilities: { [key: string]: boolean };

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
