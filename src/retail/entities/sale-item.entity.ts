import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sale } from './sale.entity';
import { RetailProduct } from './retail-product.entity';

@Entity('retail_sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sale_id' })
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => RetailProduct)
  @JoinColumn({ name: 'product_id' })
  product: RetailProduct;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ name: 'price_at_sale', type: 'decimal', precision: 12, scale: 2 })
  priceAtSale: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;
}
