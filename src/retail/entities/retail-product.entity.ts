import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { RetailStockMovement } from './retail-stock-movement.entity';

@Entity('retail_products')
@Index(['businessId', 'barcode'], { unique: true })
export class RetailProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column()
  name: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ name: 'sale_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  salePrice: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 12, scale: 2, default: 0 })
  costPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  stock: number; // Snapshot

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => RetailStockMovement, (movement) => movement.product)
  movements: RetailStockMovement[];
}
