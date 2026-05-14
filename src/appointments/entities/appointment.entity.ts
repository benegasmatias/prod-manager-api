import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { AppointmentStatus } from '../../common/enums';

@Entity('appointments')
@Index(['businessId'])
@Index(['customerId'])
@Index(['start'])
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'business_id' })
    businessId: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({ name: 'customer_id', nullable: true })
    customerId: string;

    @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @Column({ name: 'vehicle_id', nullable: true })
    vehicleId: string;

    @ManyToOne(() => Vehicle, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({ name: 'employee_id', nullable: true })
    employeeId: string;

    @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column()
    subject: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'timestamp' })
    start: Date;

    @Column({ type: 'timestamp', nullable: true })
    end: Date;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING
    })
    status: AppointmentStatus;

    @Column({ nullable: true })
    type: string; // Generic type (e.g., 'REVISION', 'SERVICE')

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Column({ name: 'converted_order_id', nullable: true })
    convertedOrderId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
