import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, OneToOne, Index } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderItemStatus } from '../../common/enums';
import { ProductionJob } from '../../jobs/entities/production-job.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: OrderItemStatus,
        enumName: 'order_items_status_enum',
        default: OrderItemStatus.PENDING
    })
    status: OrderItemStatus;

    @Column({ name: 'is_pending_quote', type: 'boolean', default: false })
    isPendingQuote: boolean;

    @Index()
    @Column({ name: 'order_id' })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ nullable: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'stl_url', nullable: true })
    stlUrl: string;

    @Column({ name: 'reference_images', type: 'jsonb', nullable: true })
    referenceImages: any[];

    @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
    estimatedMinutes: number;

    @Column({ name: 'weight_grams', type: 'float', nullable: true })
    weightGrams: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    price: number;

    @Column({ type: 'int', default: 1 })
    qty: number;

    @Column({ name: 'done_qty', type: 'int', default: 0 })
    doneQty: number;

    // --- Technical relationships / compatibility ---

    @Column({ name: 'product_id', nullable: true })
    productId: string;

    @ManyToOne(() => Product, (product) => product.orderItems, { nullable: true })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @OneToOne(() => ProductionJob, (job) => job.orderItem)
    productionJob: ProductionJob;

    @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    subtotal: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
    deposit: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Column({ name: 'estimated_unit_cost', type: 'decimal', precision: 12, scale: 2, nullable: true })
    estimatedUnitCost: number;

    @Column({ name: 'estimated_sale_unit_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
    estimatedSaleUnitPrice: number;
}
