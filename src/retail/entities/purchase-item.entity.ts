import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Purchase } from './purchase.entity';
import { RetailProduct } from './retail-product.entity';

@Entity('retail_purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_id' })
  purchaseId: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.items)
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => RetailProduct)
  @JoinColumn({ name: 'product_id' })
  product: RetailProduct;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 12, scale: 2 })
  costPrice: number; // Immutable historical cost at time of purchase
}
