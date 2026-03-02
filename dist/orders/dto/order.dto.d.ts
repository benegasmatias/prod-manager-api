import { OrderStatus, Priority } from '../../common/enums';
export declare class CreateOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice?: number;
}
export declare class CreateOrderDto {
    customerId: string;
    dueDate: Date;
    items: CreateOrderItemDto[];
}
export declare class UpdateOrderDto {
    status?: OrderStatus;
    priority?: Priority;
    dueDate?: Date;
}
export declare class FilterOrderDto {
    status?: OrderStatus;
    fromDueDate?: Date;
    toDueDate?: Date;
    customerId?: string;
    q?: string;
    page?: number;
    limit?: number;
}
