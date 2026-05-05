import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Order } from '../../orders/entities/order.entity';
import { Business } from '../../businesses/entities/business.entity';

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Business)
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'customer_id' })
    customerId: string;

    @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Index()
    @Column()
    plate: string; // Patente / Dominio

    @Column()
    brand: string;

    @Column()
    model: string;

    @Column({ nullable: true })
    year: number;

    @Column({ nullable: true })
    color: string;

    @Column({ name: 'vin_chassis', nullable: true })
    vinChassis: string;

    @Column({ name: 'engine_number', nullable: true })
    engineNumber: string;

    @Column({ type: 'int', default: 0 })
    kilometers: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Order, (order) => (order as any).vehicle)
    orders: Order[];
}
