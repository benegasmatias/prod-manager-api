import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested, IsBoolean } from 'class-validator';
import { OrderStatus, OrderType } from '../../common/enums';

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
    direccion_obra?: string;

    @IsString()
    @IsOptional()
    fecha_visita?: string;

    @IsString()
    @IsOptional()
    hora_visita?: string;

    @IsString()
    @IsOptional()
    observaciones_visita?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    stlUrl?: string;

    @IsInt()
    @Min(0)
    estimatedMinutes: number;

    @IsNumber()
    @Min(0)
    weightGrams: number;

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

    @IsString()
    @IsOptional()
    direccion_obra?: string;

    @IsString()
    @IsOptional()
    fecha_visita?: string;

    @IsString()
    @IsOptional()
    hora_visita?: string;

    @IsString()
    @IsOptional()
    observaciones_visita?: string;

    @IsOptional()
    metadata?: any;
}

export class UpdateProgressDto {
    @IsInt()
    @Min(0)
    doneQty: number;
}

export class UpdateOrderStatusDto {
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
    totalPrice?: number;

    @IsNumber()
    @IsOptional()
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
    items?: any[];

    @IsString()
    @IsOptional()
    direccion_obra?: string;

    @IsString()
    @IsOptional()
    fecha_visita?: string;

    @IsString()
    @IsOptional()
    hora_visita?: string;

    @IsString()
    @IsOptional()
    observaciones_visita?: string;

    @IsOptional()
    metadata?: any;
}

export class BaseOrderFilterDto {
    @IsString()
    @IsOptional()
    businessId?: string;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    pageSize?: number = 50;

    @IsString()
    @IsOptional()
    search?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    startDate?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    endDate?: Date;

    @IsOptional()
    @IsString()
    responsableId?: string;
}

export class FindOrdersDto extends BaseOrderFilterDto {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsOptional()
    statuses?: string | string[];

    @IsOptional()
    excludeStatuses?: string | string[];

    @IsEnum(OrderType)
    @IsOptional()
    type?: OrderType;
}

export class FindVisitsDto extends BaseOrderFilterDto {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus; // Permite filtrar por un estado de visita específico dentro de las visitas
}

export class FindQuotationsDto extends BaseOrderFilterDto {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;
}

export class ReportFailureDto {
    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsNumber()
    @Min(0)
    wastedGrams: number;

    @IsString()
    @IsOptional()
    materialId?: string;

    @IsBoolean()
    moveToReprint: boolean;

    @IsOptional()
    @IsEnum(OrderStatus)
    targetStatus?: OrderStatus;

    @IsOptional()
    metadata?: any;
}

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
