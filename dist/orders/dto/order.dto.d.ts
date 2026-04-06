import { OrderStatus, OrderType } from '../../common/enums';
export declare class OrderSiteInfoDto {
    address?: string;
    visitDate?: string;
    visitTime?: string;
    visitObservations?: string;
}
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
    description?: string;
    stlUrl?: string;
    referenceImages?: any[];
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
    totalSenias?: number;
    responsableGeneralId?: string;
    siteInfo?: OrderSiteInfoDto;
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
    totalSenias?: number;
    dueDate?: Date;
    notes?: string;
    responsableGeneralId?: string;
    items?: CreateOrderItemDto[];
    siteInfo?: OrderSiteInfoDto;
    metadata?: any;
}
export declare class FindOrdersDto {
    businessId?: string;
    responsableId?: string;
    status?: OrderStatus;
    statuses?: OrderStatus[] | string;
    excludeStatuses?: OrderStatus[] | string;
    type?: OrderType;
    page?: number;
    pageSize?: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
}
export declare class FindVisitsDto extends FindOrdersDto {
}
export declare class FindQuotationsDto extends FindOrdersDto {
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
export declare class ReportFailureDto {
    reason: string;
    wastedGrams: number;
    materialId?: string;
    moveToReprint?: boolean;
    metadata?: any;
}
