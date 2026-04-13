import { IsString, IsOptional, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';
import { RetailStockMovementType } from '../retail.enums';

export class CreateRetailProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsNumber()
  @Min(0)
  costPrice: number;
}

export class UpdateRetailProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class StockAdjustmentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(RetailStockMovementType)
  type: RetailStockMovementType;

  @IsOptional()
  @IsString()
  note?: string;
}
