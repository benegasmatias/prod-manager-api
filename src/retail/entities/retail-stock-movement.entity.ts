import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RetailProduct } from './retail-product.entity';
import { RetailStockMovementType } from '../retail.enums';

@Entity('retail_stock_movements')
export class RetailStockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => RetailProduct, (product) => product.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: RetailProduct;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  amount: number; // Siempre positivo, el tipo determina el sentido

  @Column({ type: 'enum', enum: RetailStockMovementType })
  type: RetailStockMovementType;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
