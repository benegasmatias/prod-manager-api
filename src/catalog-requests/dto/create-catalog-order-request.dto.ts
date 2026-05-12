import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethod } from '../../common/enums';

class CreateCatalogOrderRequestItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateCatalogOrderRequestDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(DeliveryMethod)
  @IsNotEmpty()
  deliveryMethod: DeliveryMethod;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCatalogOrderRequestItemDto)
  items: CreateCatalogOrderRequestItemDto[];
}
