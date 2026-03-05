import { Order } from '../../orders/entities/order.entity';
import { Business } from '../../businesses/entities/business.entity';
export declare class Customer {
    id: string;
    name: string;
    businessId: string;
    business: Business;
    phone: string;
    email: string;
    notes: string;
    createdAt: Date;
    orders: Order[];
}
