import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { CashDrawerStatus } from '../retail.enums';
import { CashMovement } from './cash-movement.entity';

@Entity('cash_drawers')
@Index(['businessId'], { unique: true, where: `"status" = 'OPEN'` })
export class CashDrawer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({ name: 'operator_id', nullable: true })
  operatorId: string;

  @Column({ type: 'enum', enum: CashDrawerStatus, default: CashDrawerStatus.CLOSED })
  status: CashDrawerStatus;

  @Column({ name: 'opening_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ name: 'current_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentBalance: number;

  @Column({ name: 'closing_balance', type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingBalance: number;

  @Column({ name: 'opened_at', type: 'timestamp', nullable: true })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => CashMovement, (movement) => movement.drawer)
  movements: CashMovement[];
}
