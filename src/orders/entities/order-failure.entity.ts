import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('order_failures')
export class OrderFailure {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id' })
    orderId: string;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ type: 'text' })
    reason: string;

    @Column({ name: 'wasted_grams', type: 'float', default: 0 })
    wastedGrams: number;

    @Column({ name: 'material_id', nullable: true })
    materialId: string;

    @ManyToOne(() => Material, { nullable: true })
    @JoinColumn({ name: 'material_id' })
    material: Material;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
