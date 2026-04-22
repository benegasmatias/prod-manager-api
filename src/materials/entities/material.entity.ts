import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { MaterialType } from '../../common/enums';
import { ProductionJobMaterial } from '../../jobs/entities/production-job-material.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('materials')
export class Material {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: MaterialType })
    type: MaterialType;

    @Column({ nullable: true })
    brand: string;

    @Column({ nullable: true })
    color: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'business_id', nullable: true })
    businessId: string;

    @Column({ name: 'total_weight_grams', type: 'float', default: 1000 })
    totalWeightGrams: number;

    @Column({ name: 'remaining_weight_grams', type: 'float', default: 1000 })
    remainingWeightGrams: number;

    @Column({ type: 'int', nullable: true })
    bedTemperature?: number;

    @Column({ type: 'int', nullable: true })
    nozzleTemperature?: number;

    @Column({ nullable: true })
    unit: string;

    @Column({ name: 'cost_per_kg', type: 'float', default: 0 })
    costPerKg: number;

    @Column({ default: true })
    active: boolean;

    @Column({ type: 'jsonb', nullable: true, default: {} })
    attributes?: Record<string, string | number | boolean | null>;

    @OneToMany(() => ProductionJobMaterial, (jm) => jm.material)
    jobMaterials: Array<ProductionJobMaterial>;
}
