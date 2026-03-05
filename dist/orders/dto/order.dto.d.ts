import { OrderStatus } from '../../common/enums';
export declare class CreateOrderItemDto {
    name: string;
    description?: string;
    stlUrl?: string;
    estimatedMinutes: number;
    weightGrams: number;
    price: number;
    qty: number;
    deposit?: number;
}
export declare class CreateOrderDto {
    businessId: string;
    customerId?: string;
    clientName: string;
    dueDate: Date;
    priority: number;
    items: CreateOrderItemDto[];
    notes?: string;
}
export declare class UpdateProgressDto {
    doneQty: number;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    notes?: string;
}
export declare class FindOrdersDto {
    businessId?: string;
    status?: OrderStatus;
}
