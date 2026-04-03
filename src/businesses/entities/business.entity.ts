import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BusinessMembership } from './business-membership.entity';

@Entity('businesses')
export class Business {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    taxId: string; // CUIT/CUIL

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ default: 'GENERICO' })
    category: string; // Rubro (IMPRESION_3D, METALURGICA, etc)

    @Column({ default: 'ARS' })
    currency: string; // ARS, USD, etc

    @Column({ default: 'DRAFT' })
    status: string; // DRAFT, ACTIVE, SUSPENDED, ARCHIVED

    @Column({ name: 'plan_id', nullable: true })
    planId: string; // Pro, Enterprise, Free, etc

    @Column({ type: 'timestamp', name: 'trial_expires_at', nullable: true })
    trialExpiresAt: Date;

    @Column({ type: 'timestamp', name: 'subscription_expires_at', nullable: true })
    subscriptionExpiresAt: Date;

    @Column({ name: 'is_enabled', default: true })
    isEnabled: boolean;

    @Column({ name: 'accepting_orders', default: true })
    acceptingOrders: boolean;

    @Column({ name: 'onboarding_completed', default: false })
    onboardingCompleted: boolean;

    @Column({ name: 'onboarding_step', default: 'BASIC_INFO' })
    onboardingStep: string;

    @Column({ type: 'jsonb', name: 'capabilities_override', nullable: true })
    capabilitiesOverride: any;


    @OneToMany('BusinessMembership', (membership: any) => membership.business)
    memberships: BusinessMembership[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
