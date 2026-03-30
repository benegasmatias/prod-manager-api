import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Machine } from '../../machines/entities/machine.entity';
import { Material } from '../../materials/entities/material.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { JobStatus } from '../../common/enums';
import { JobProgress } from './job-progress.entity';
import { JobStatusHistory } from '../../history/entities/job-status-history.entity';

@Entity('production_jobs')
export class ProductionJob {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id' })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.jobs)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'order_item_id' })
    orderItemId: string;

    @ManyToOne(() => OrderItem, (item) => item.productionJobs)
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;

    @Column({ name: 'machine_id', nullable: true })
    machineId: string;

    @ManyToOne(() => Machine, (machine) => machine.productionJobs, { nullable: true })
    @JoinColumn({ name: 'machine_id' })
    machine: Machine;

    @Column({ name: 'material_id', nullable: true })
    materialId: string;

    @ManyToOne(() => Material, (material) => material.productionJobs, { nullable: true })
    @JoinColumn({ name: 'material_id' })
    material: Material;

    @Column()
    title: string;

    @Column({ name: 'total_units' })
    totalUnits: number;

    @Column({ name: 'estimated_minutes_total', type: 'int', nullable: true })
    estimatedMinutesTotal: number;

    @Column({ name: 'estimated_weight_g_total', type: 'float', nullable: true })
    estimatedWeightGTotal: number;

    @Column({ name: 'scheduled_start', nullable: true })
    scheduledStart: Date;

    @Column({ name: 'due_date', nullable: true })
    dueDate: Date;

    @Column({ type: 'enum', enum: JobStatus, default: JobStatus.QUEUED })
    status: JobStatus;

    @Column({ name: 'sort_rank', default: 0 })
    sortRank: number;

    @Column({ name: 'responsable_id', nullable: true })
    responsableId: string;

    @ManyToOne(() => Employee, { nullable: true })
    @JoinColumn({ name: 'responsable_id' })
    responsable: Employee;

    @Column({ type: 'text', nullable: true, name: 'notes' })
    notes: string;

    @Column({ type: 'json', nullable: true })
    metadata: any;

    @OneToMany(() => JobProgress, (progress) => progress.productionJob)
    progress: JobProgress[];

    @OneToMany(() => JobStatusHistory, (history) => history.productionJob)
    statusHistory: JobStatusHistory[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
