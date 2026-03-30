import { Order } from '../../orders/entities/order.entity';
import { OrderStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class OrderStatusHistory {
    id: string;
    orderId: string;
    order: Order;
    changedAt: Date;
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    note: string;
    performedById: string;
    performedBy: User;
}
