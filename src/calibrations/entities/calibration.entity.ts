import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Machine } from '../../machines/entities/machine.entity';
import { Material } from '../../materials/entities/material.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('calibrations')
export class Calibration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Machine, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'machine_id' })
    machine: Machine;

    @Column({ name: 'machine_id' })
    machineId: string;

    @ManyToOne(() => Material, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'material_id' })
    material?: Material;

    @Column({ name: 'material_id', nullable: true })
    materialId?: string;

    @Column()
    testType: string; // Ej: 'Torre de Temperatura', 'Retracciones', 'Flujo'

    @Column({ type: 'simple-json', nullable: true })
    results: any; // Parámetros óptimos resultantes

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'boolean', default: true })
    success: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
