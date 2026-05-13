import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('platform_config')
export class PlatformConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: false })
    allowTemporaryEmails: boolean;

    @Column({ type: 'jsonb', nullable: true })
    blockedDomains: string[];

    @UpdateDateColumn()
    updatedAt: Date;
}
