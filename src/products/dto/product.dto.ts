import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsEnum, IsBoolean, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { FulfillmentMode, ProductStatus, ProductVisibility } from '../../common/enums';

export class CreateProductDto {
    @IsUUID()
    @IsNotEmpty()
    businessId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;

    @IsEnum(ProductVisibility)
    @IsOptional()
    visibility?: ProductVisibility;

    @IsEnum(FulfillmentMode)
    @IsOptional()
    fulfillmentMode?: FulfillmentMode;

    @IsNumber()
    @Min(0)
    basePrice: number;

    @IsNumber()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    @Min(0)
    stock?: number;

    @IsBoolean()
    @IsOptional()
    allowBackorder?: boolean;

    @IsNumber()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    @Min(0)
    leadTimeDays?: number;

    @IsNumber()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    @Min(0)
    estimatedProductionMinutes?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    weightG?: number;

    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @IsOptional()
    attributes?: any;

    @IsOptional()
    metadata?: any;
}

export class UpdateProductDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;

    @IsEnum(ProductVisibility)
    @IsOptional()
    visibility?: ProductVisibility;

    @IsEnum(FulfillmentMode)
    @IsOptional()
    fulfillmentMode?: FulfillmentMode;

    @IsNumber()
    @IsOptional()
    @Min(0)
    basePrice?: number;

    @IsNumber()
    @IsInt()
    @IsOptional()
    @Min(0)
    stock?: number;

    @IsBoolean()
    @IsOptional()
    allowBackorder?: boolean;

    @IsNumber()
    @IsInt()
    @IsOptional()
    @Min(0)
    leadTimeDays?: number;

    @IsNumber()
    @IsInt()
    @IsOptional()
    @Min(0)
    estimatedProductionMinutes?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    weightG?: number;

    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @IsOptional()
    attributes?: any;

    @IsOptional()
    metadata?: any;
}

export class FindProductsDto {
    @IsUUID()
    @IsNotEmpty()
    businessId: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsEnum(ProductStatus)
    @IsOptional()
    status?: ProductStatus;

    @IsEnum(FulfillmentMode)
    @IsOptional()
    fulfillmentMode?: FulfillmentMode;

    @IsString()
    @IsOptional()
    search?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    limit?: number;
}
