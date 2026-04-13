import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { CashMovementType } from '../retail.enums';

export class OpenDrawerDto {
  @IsNumber()
  openingBalance: number;
}

export class ManualMovementDto {
  @IsNumber()
  amount: number;

  @IsEnum(CashMovementType)
  type: CashMovementType;

  @IsOptional()
  @IsString()
  note?: string;
}
