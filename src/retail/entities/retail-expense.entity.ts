import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { CashDrawer } from './cash-drawer.entity';
import { RetailExpenseCategory } from '../retail.enums';

@Entity('retail_expenses')
export class RetailExpense {
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

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: RetailExpenseCategory,
    default: RetailExpenseCategory.OTHER,
  })
  category: RetailExpenseCategory;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
