import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
export declare class OrderFinancialService {
    calculateItemsTotal(items: any[]): number;
    calculateTotalDeposits(items: OrderItem[]): number;
    calculateTotalPayments(order: Order): number;
    calculatePendingBalance(order: Order): number;
}
