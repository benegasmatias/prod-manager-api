import { Type, Transform } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested, IsBoolean, ValidateIf } from 'class-validator';
import { OrderStatus, OrderType } from '../../common/enums';

export class OrderSiteInfoDto {
    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    visitDate?: string;

    @IsString()
    @IsOptional()
    visitTime?: string;

    @IsString()
    @IsOptional()
    visitObservations?: string;
}

export class CreateOrderItemDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    medidas?: string;

    @IsString()
    @IsOptional()
    material?: string;

    @IsString()
    @IsOptional()
    tipo_trabajo?: string;

    @IsString()
    @IsOptional()
    material_estructura?: string;

    @IsString()
    @IsOptional()
    fillMaterial?: string;

    @IsString()
    @IsOptional()
    revestimiento?: string;

    @IsString()
    @IsOptional()
    terminacion?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsArray()
    @IsOptional()
    accessories?: string[];

    @IsBoolean()
    @IsOptional()
    instalacion?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    stlUrl?: string;

    @IsArray()
    @IsOptional()
    referenceImages?: any[];

    @IsBoolean()
    @IsOptional()
    isPendingQuote?: boolean;

    @ValidateIf(o => !o.isPendingQuote)
    @IsInt()
    @Min(0)
    estimatedMinutes: number;

    @ValidateIf(o => !o.isPendingQuote)
    @IsNumber()
    @Min(0)
    weightGrams: number;

    @ValidateIf(o => !o.isPendingQuote)
    @IsNumber()
    @Min(0)
    price: number;

    @IsInt()
    @Min(1)
    qty: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    deposit?: number;

    @IsOptional()
    metadata?: any;

    @IsNumber()
    @IsOptional()
    @Min(0)
    estimatedUnitCost?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    estimatedSaleUnitPrice?: number;
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    businessId: string;

    @IsString()
    @IsOptional()
    customerId?: string;

    @IsString()
    @IsOptional()
    clientName?: string;

    @IsEnum(OrderType)
    @IsOptional()
    type?: OrderType;

    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dueDate?: Date;

    @IsInt()
    @Min(1)
    priority: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsString()
    @IsOptional()
    notes?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    totalPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    totalSenias?: number;

    @IsString()
    @IsOptional()
    responsableGeneralId?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => OrderSiteInfoDto)
    siteInfo?: OrderSiteInfoDto;

    @IsOptional()
    metadata?: any;

    @IsString()
    @IsOptional()
    vehicleId?: string;
}

export class UpdateProgressDto {
    @IsInt()
    @Min(0)
    doneQty: number;
}

export class UpdateOrderStatusDto {
    @IsString()
    @IsOptional()
    businessId?: string;

    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsEnum(OrderType)
    @IsOptional()
    type?: OrderType;

    @IsString()
    @IsOptional()
    clientName?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    totalPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    totalSenias?: number;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dueDate?: Date;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    responsableGeneralId?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items?: CreateOrderItemDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => OrderSiteInfoDto)
    siteInfo?: OrderSiteInfoDto;

    @IsOptional()
    metadata?: any;

    @IsString()
    @IsOptional()
    vehicleId?: string;
}

export class FindOrdersDto {
    @IsString()
    @IsOptional()
    businessId?: string;

    @IsString()
    @IsOptional()
    vehicleId?: string;

    @IsString()
    @IsOptional()
    responsableId?: string;

    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsOptional()
    statuses?: OrderStatus[] | string;

    @IsOptional()
    excludeStatuses?: OrderStatus[] | string;

    @IsEnum(OrderType)
    @IsOptional()
    type?: OrderType;

    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(String(value), 10) : 1))
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(String(value), 10) : 50))
    @IsInt()
    @Min(1)
    pageSize?: number;

    @IsString()
    @IsOptional()
    search?: string;

    @IsOptional()
    @IsString()
    urgency?: string;

    @IsOptional()
    @IsString()
    alertFilter?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    startDate?: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    endDate?: Date;
}

export class FindVisitsDto extends FindOrdersDto { }
export class FindQuotationsDto extends FindOrdersDto { }

export class OrderSummaryResponseDto {
    totalVolume: number;
    pendingBalance: number;
    activeCount: number;
}

export class BudgetSummaryResponseDto {
    totalBudgeted: number;
    pendingApprovalCount: number;
    conversionRate: number;
}

export class ReportFailureDto {
    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    wastedGrams?: number;

    @IsString()
    @IsOptional()
    materialId?: string;

    @IsArray()
    @IsOptional()
    materialWastes?: { materialId: string, grams: number }[];

    @IsString()
    @IsOptional()
    action?: 'REDO' | 'DISCARD' | 'KEEP';

    @IsString()
    @IsOptional()
    itemId?: string;

    @IsString()
    @IsOptional()
    businessId?: string;

    @IsString()
    @IsOptional()
    targetStatus?: string;

    @IsOptional()
    metadata?: any;
}
