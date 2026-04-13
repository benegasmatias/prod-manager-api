import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { CashDrawer } from './cash-drawer.entity';
import { PaymentMethod } from '../../common/enums';
import { SaleItem } from './sale-item.entity';

@Entity('retail_sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'drawer_id' })
  drawerId: string;

  @ManyToOne(() => CashDrawer)
  @JoinColumn({ name: 'drawer_id' })
  drawer: CashDrawer;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ default: 'COMPLETED' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items: SaleItem[];
}
