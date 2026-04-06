import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProductionJob } from './production-job.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('production_job_materials')
export class ProductionJobMaterial {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'job_id' })
    jobId: string;

    @ManyToOne(() => ProductionJob, (job) => job.jobMaterials, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job: ProductionJob;

    @Column({ name: 'material_id' })
    materialId: string;

    @ManyToOne(() => Material, { eager: true })
    @JoinColumn({ name: 'material_id' })
    material: Material;

    @Column({ type: 'float' })
    quantity: number;

    @Column({ name: 'consumed_quantity', type: 'float', default: 0 })
    consumedQuantity: number;

    @Column({ name: 'is_reserved', default: true })
    isReserved: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
