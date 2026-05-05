import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Unique, OneToOne, Index } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus, OrderType } from '../../common/enums';
import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { OrderStatusHistory } from '../../history/entities/order-status-history.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { OrderFailure } from './order-failure.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { OrderSiteInfo } from './order-site-info.entity';

@Entity('orders')
@Unique(['code', 'businessId'])
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'business_id', nullable: true })
    businessId: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'client_name', nullable: true })
    clientName: string;

    @Index()
    @Column({ name: 'due_date', nullable: true })
    dueDate: Date;

    @Column({ type: 'int', default: 1 })
    priority: number;

    @Index()
    @Column({
        type: 'enum',
        enum: OrderStatus,
        enumName: 'orders_status_enum',
        default: OrderStatus.PENDING
    })
    status: OrderStatus;

    @Column({
        type: 'enum',
        enum: OrderType,
        default: OrderType.CLIENT
    })
    type: OrderType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @Column({ name: 'customer_id', nullable: true })
    customerId: string;

    @ManyToOne(() => Customer, (customer) => customer.orders)
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @OneToMany(() => ProductionJob, (job) => job.order)
    jobs: ProductionJob[];

    @OneToMany(() => OrderStatusHistory, (history) => history.order)
    statusHistory: OrderStatusHistory[];

    @OneToMany(() => OrderFailure, (failure) => failure.order)
    failures: OrderFailure[];

    @OneToMany(() => Payment, (payment) => payment.order)
    payments: Payment[];

    @OneToOne(() => OrderSiteInfo, (si) => si.order, { cascade: true })
    siteInfo: OrderSiteInfo;

    @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
    totalPrice: number;

    @Column({ name: 'total_senias', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
    totalSenias: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    code: string;

    @Column({ name: 'responsable_general_id', nullable: true })
    responsableGeneralId: string;

    @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'responsable_general_id' })
    responsableGeneral: Employee;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Column({ name: 'vehicle_id', nullable: true })
    vehicleId: string;

    @ManyToOne('Vehicle', { nullable: true })
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: any;

    get isQuotePending(): boolean {
        return this.items?.some(it => it.isPendingQuote) || this.totalPrice === null;
    }
}
