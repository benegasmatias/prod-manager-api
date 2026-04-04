import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Machine } from '../../machines/entities/machine.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Business } from '../../businesses/entities/business.entity';
import { ProductionJobStatus, ProductionJobPriority } from '../../common/enums';

@Entity('production_jobs')
@Index(['businessId'])
@Index(['status'])
@Index(['machineId'])
@Index(['operatorId'])
@Unique(['orderItemId'])
export class ProductionJob {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'order_id' })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.jobs)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'order_item_id', unique: true })
    orderItemId: string;

    @OneToOne(() => OrderItem, (item) => item.productionJob, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;

    @Column({ name: 'machine_id', nullable: true })
    machineId: string;

    @ManyToOne(() => Machine, (machine) => machine.productionJobs, { nullable: true })
    @JoinColumn({ name: 'machine_id' })
    machine: Machine;

    @Column({ name: 'operator_id', nullable: true })
    operatorId: string;

    @ManyToOne(() => Employee, { nullable: true })
    @JoinColumn({ name: 'operator_id' })
    operator: Employee;

    @Column({
        type: 'enum',
        enum: ProductionJobStatus,
        default: ProductionJobStatus.QUEUED
    })
    status: ProductionJobStatus;

    @Column({
        type: 'enum',
        enum: ProductionJobPriority,
        default: ProductionJobPriority.NORMAL
    })
    priority: ProductionJobPriority;

    @Column({ name: 'current_stage', type: 'varchar', length: 100, nullable: true })
    currentStage: string; // Validated against template in service

    @Column({ default: 0 })
    sequence: number;

    @Column({ name: 'started_at', type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
    estimatedMinutes: number;

    @Column({ name: 'actual_minutes', type: 'int', nullable: true })
    actualMinutes: number;

    @Column({ name: 'pause_reason', type: 'text', nullable: true })
    pauseReason: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
