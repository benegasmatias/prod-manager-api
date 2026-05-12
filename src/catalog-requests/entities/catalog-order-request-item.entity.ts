import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CatalogOrderRequest } from './catalog-order-request.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('catalog_order_request_items')
export class CatalogOrderRequestItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'request_id' })
    requestId: string;

    @ManyToOne(() => CatalogOrderRequest, (request) => request.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'request_id' })
    request: CatalogOrderRequest;

    @Column({ name: 'product_id', nullable: true })
    productId: string;

    @ManyToOne(() => Product, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'product_name_snapshot' })
    productNameSnapshot: string;

    @Column({ name: 'unit_price_snapshot', type: 'decimal', precision: 12, scale: 2 })
    unitPriceSnapshot: number;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ name: 'subtotal_snapshot', type: 'decimal', precision: 12, scale: 2 })
    subtotalSnapshot: number;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
