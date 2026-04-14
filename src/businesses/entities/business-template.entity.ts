import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('business_templates')
export class BusinessTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;

    @Column()
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ name: 'image_key' })
    imageKey: string;

    @Column({ type: 'jsonb', nullable: true })
    config: any;

    @Column({ type: 'jsonb', name: 'default_capabilities', nullable: true })
    defaultCapabilities: string[];

    @Column({ name: 'is_enabled', default: true })
    isEnabled: boolean;

    @Column({ name: 'is_available', default: true })
    isAvailable: boolean;

    @Column({ name: 'is_coming_soon', default: false })
    isComingSoon: boolean;

    @Column({ name: 'required_plan', default: 'FREE' })
    requiredPlan: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
