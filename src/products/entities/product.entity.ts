import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductFile } from './product-file.entity';
import { Business } from '../../businesses/entities/business.entity';
import { ProductCategory } from './product-category.entity';
import { FulfillmentMode, ProductStatus, ProductVisibility } from '../../common/enums';

@Entity('products')
@Index(['businessId', 'slug'], { unique: true })
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column()
    name: string;

    @Column()
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'category_id', nullable: true })
    categoryId: string;

    @ManyToOne(() => ProductCategory, (cat) => cat.products, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    category: ProductCategory;

    @Column({
        type: 'enum',
        enum: ProductStatus,
        default: ProductStatus.DRAFT
    })
    status: ProductStatus;

    @Column({
        type: 'enum',
        enum: ProductVisibility,
        default: ProductVisibility.PUBLIC
    })
    visibility: ProductVisibility;

    @Column({
        name: 'fulfillment_mode',
        type: 'enum',
        enum: FulfillmentMode,
        default: FulfillmentMode.MAKE_TO_ORDER
    })
    fulfillmentMode: FulfillmentMode;

    @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
    basePrice: number;

    @Column({ name: 'wholesale_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
    wholesalePrice: number;

    @Column({ type: 'int', default: 0 })
    stock: number;

    @Column({ name: 'allow_backorder', default: false })
    allowBackorder: boolean;

    @Column({ name: 'lead_time_days', type: 'int', default: 0 })
    leadTimeDays: number;

    @Column({ name: 'estimated_production_minutes', type: 'int', nullable: true })
    estimatedProductionMinutes: number;

    @Column({ name: 'weight_g', type: 'float', nullable: true })
    weightG: number;

    @Column({ name: 'thumbnail_url', nullable: true })
    thumbnailUrl: string;

    @Column({ type: 'jsonb', nullable: true })
    attributes: any;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => OrderItem, (item) => item.product)
    orderItems: OrderItem[];

    @OneToMany(() => ProductFile, (file) => file.product)
    productFiles: ProductFile[];
}
