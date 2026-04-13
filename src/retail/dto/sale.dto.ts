import { IsArray, IsEnum, IsUUID, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../common/enums';

export class SaleItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class ProcessSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
