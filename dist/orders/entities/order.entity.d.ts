import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { Priority, OrderStatus } from '../../common/enums';
import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { OrderStatusHistory } from '../../history/entities/order-status-history.entity';
import { Payment } from '../../payments/entities/payment.entity';
export declare class Order {
    id: string;
    customerId: string;
    customer: Customer;
    code: string;
    createdAt: Date;
    dueDate: Date;
    priority: Priority;
    status: OrderStatus;
    totalPrice: number;
    notes: string;
    items: OrderItem[];
    jobs: ProductionJob[];
    statusHistory: OrderStatusHistory[];
    payments: Payment[];
}
