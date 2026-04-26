import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Material } from './material.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('material_movements')
export class MaterialMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Material)
    @JoinColumn({ name: 'material_id' })
    material: Material;

    @Column({ name: 'material_id' })
    materialId: string;

    @Column({ type: 'enum', enum: ['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'] })
    type: string;

    @Column('float')
    quantity: number;

    @Column('float', { nullable: true })
    oldValue?: number;

    @Column('float', { nullable: true })
    newValue?: number;

    @Column({ nullable: true })
    unit?: string;

    @Column({ nullable: true })
    sourceDepositId?: string;

    @Column({ nullable: true })
    targetDepositId?: string;

    @Column({ nullable: true })
    referenceType?: string; // e.g., 'ORDER', 'PURCHASE'

    @Column({ nullable: true })
    referenceId?: string;

    @Column({ nullable: true })
    notes?: string;

    @Column()
    createdBy: string; // User UUID

    @CreateDateColumn()
    createdAt: Date;
}
