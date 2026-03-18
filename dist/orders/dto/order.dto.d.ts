import { OrderStatus, OrderType } from '../../common/enums';
export declare class CreateOrderItemDto {
    id?: string;
    name: string;
    medidas?: string;
    material?: string;
    tipo_trabajo?: string;
    material_estructura?: string;
    fillMaterial?: string;
    revestimiento?: string;
    terminacion?: string;
    color?: string;
    accessories?: string[];
    instalacion?: boolean;
    direccion_obra?: string;
    fecha_visita?: string;
    hora_visita?: string;
    observaciones_visita?: string;
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
    status?: OrderStatus;
    dueDate?: Date;
    priority: number;
    items: CreateOrderItemDto[];
    notes?: string;
    totalPrice?: number;
    responsableGeneralId?: string;
    direccion_obra?: string;
    fecha_visita?: string;
    hora_visita?: string;
    observaciones_visita?: string;
    metadata?: any;
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
    items?: any[];
    direccion_obra?: string;
    fecha_visita?: string;
    hora_visita?: string;
    observaciones_visita?: string;
    metadata?: any;
}
export declare class BaseOrderFilterDto {
    businessId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    responsableId?: string;
}
export declare class FindOrdersDto extends BaseOrderFilterDto {
    status?: OrderStatus;
    statuses?: string | string[];
    excludeStatuses?: string | string[];
    type?: OrderType;
}
export declare class FindVisitsDto extends BaseOrderFilterDto {
    status?: OrderStatus;
}
export declare class FindQuotationsDto extends BaseOrderFilterDto {
    status?: OrderStatus;
}
export declare class ReportFailureDto {
    reason: string;
    wastedGrams: number;
    materialId?: string;
    moveToReprint: boolean;
    targetStatus?: OrderStatus;
    metadata?: any;
}
export declare class OrderSummaryResponseDto {
    totalVolume: number;
    pendingBalance: number;
    activeCount: number;
}
export declare class BudgetSummaryResponseDto {
    totalBudgeted: number;
    pendingApprovalCount: number;
    conversionRate: number;
}
