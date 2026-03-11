import { OrderStatus, OrderType } from '../../common/enums';
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
    estimatedUnitCost?: number;
    estimatedSaleUnitPrice?: number;
}
export declare class CreateOrderDto {
    businessId: string;
    customerId?: string;
    clientName?: string;
    type?: OrderType;
    dueDate?: Date;
    priority: number;
    items: CreateOrderItemDto[];
    notes?: string;
    responsableGeneralId?: string;
}
export declare class UpdateProgressDto {
    doneQty: number;
}
export declare class UpdateOrderStatusDto {
    status?: OrderStatus;
    type?: OrderType;
    clientName?: string;
    totalPrice?: number;
    dueDate?: Date;
    notes?: string;
    responsableGeneralId?: string;
}
export declare class FindOrdersDto {
    businessId?: string;
    status?: OrderStatus;
    type?: OrderType;
}
export declare class ReportFailureDto {
    reason: string;
    wastedGrams: number;
    materialId?: string;
    moveToReprint: boolean;
    targetStatus?: OrderStatus;
    metadata?: any;
}
