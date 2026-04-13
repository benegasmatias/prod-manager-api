import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CashDrawer } from './cash-drawer.entity';
import { CashMovementType } from '../retail.enums';

@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'drawer_id' })
  drawerId: string;

  @ManyToOne(() => CashDrawer, (drawer) => drawer.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drawer_id' })
  drawer: CashDrawer;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: CashMovementType })
  type: CashMovementType;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @Column({ name: 'sale_id', nullable: true })
  saleId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
