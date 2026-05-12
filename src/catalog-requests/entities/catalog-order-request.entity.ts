import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { CatalogRequestStatus, DeliveryMethod } from '../../common/enums';
import { CatalogOrderRequestItem } from './catalog-order-request-item.entity';

@Entity('catalog_order_requests')
export class CatalogOrderRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({
        type: 'enum',
        enum: CatalogRequestStatus,
        default: CatalogRequestStatus.REQUESTED
    })
    status: CatalogRequestStatus;

    @Column({ name: 'customer_name' })
    customerName: string;

    @Column({ name: 'customer_phone' })
    customerPhone: string;

    @Column({ name: 'customer_email', nullable: true })
    customerEmail: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({
        name: 'delivery_method',
        type: 'enum',
        enum: DeliveryMethod,
        default: DeliveryMethod.TO_DEFINE
    })
    deliveryMethod: DeliveryMethod;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ name: 'total_snapshot', type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalSnapshot: number;

    @Column({ name: 'order_id', nullable: true })
    orderId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => CatalogOrderRequestItem, (item) => item.request, { cascade: true })
    items: CatalogOrderRequestItem[];
}
