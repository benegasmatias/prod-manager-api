import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_site_info')
export class OrderSiteInfo {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id' })
    orderId: string;

    @OneToOne(() => Order, (order) => order.siteInfo, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'address', nullable: true })
    address: string;

    @Column({ name: 'visit_date', nullable: true })
    visitDate: string;

    @Column({ name: 'visit_time', nullable: true })
    visitTime: string;

    @Column({ name: 'visit_observations', type: 'text', nullable: true })
    visitObservations: string;
}
