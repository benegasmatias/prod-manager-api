import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested, IsBoolean } from 'class-validator';
import { OrderStatus } from '../../common/enums';

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    name: string;

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
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    businessId: string;

    @IsString()
    @IsOptional()
    customerId?: string;

    @IsString()
    @IsNotEmpty()
    clientName: string;

    @IsDate()
    @Type(() => Date)
    dueDate: Date;

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

    @IsString()
    @IsOptional()
    responsableGeneralId?: string;
}

export class UpdateProgressDto {
    @IsInt()
    @Min(0)
    doneQty: number;
}

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    responsableGeneralId?: string;
}

export class FindOrdersDto {
    @IsString()
    @IsOptional()
    businessId?: string;

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
    metadata?: any;
}
