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
    metadata?: any;
}
export declare class CreateOrderDto {
    businessId: string;
    customerId?: string;
    clientName: string;
    dueDate: Date;
    priority: number;
    items: CreateOrderItemDto[];
    notes?: string;
    responsableGeneralId?: string;
}
export declare class UpdateProgressDto {
    doneQty: number;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    notes?: string;
    responsableGeneralId?: string;
}
export declare class FindOrdersDto {
    businessId?: string;
    status?: OrderStatus;
}
