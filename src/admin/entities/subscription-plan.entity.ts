import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
    @PrimaryColumn()
    id: string; // 'free', 'pro', 'business'

    @Column({ nullable: true })
    category: string; // 'IMPRESION_3D', 'METALURGICA', etc. (null = global)

    @Column()
    name: string;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    price: number;

    @Column({ default: 'ARS' })
    currency: string;

    @Column({ nullable: true })
    description: string;

    @Column('simple-json', { default: '[]' })
    features: string[];

    @Column('simple-json', { default: '[]' })
    sidebarItems: string[];

    @Column({ default: 0 })
    maxUsers: number; // 0 = unlimited

    @Column({ default: 0 })
    maxOrdersPerMonth: number; // 0 = unlimited

    @Column({ default: 0 })
    maxBusinesses: number; // 0 = unlimited

    @Column({ default: 0 })
    maxMachines: number; // 0 = unlimited

    @Column({ default: false })
    isRecommended: boolean;

    @Column({ nullable: true })
    ctaText: string; // 'Comenzar gratis', 'Probar 14 días gratis', etc.

    @Column({ nullable: true })
    ctaLink: string; // '/register', etc.

    @Column({ default: 0 })
    sortOrder: number;

    @Column({ default: true })
    active: boolean;

    @Column({ default: false })
    hasTrial: boolean;

    @Column({ default: 0 })
    trialDays: number;

    @Column('decimal', { precision: 12, scale: 2, nullable: true })
    promoPrice: number;

    @Column({ nullable: true })
    promoDurationMonths: number;

    @Column({ nullable: true })
    promoLabel: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
