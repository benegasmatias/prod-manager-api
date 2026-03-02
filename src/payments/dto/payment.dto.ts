import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../common/enums';

export class CreatePaymentDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    method: PaymentMethod;

    @IsString()
    @IsOptional()
    reference?: string;
}
