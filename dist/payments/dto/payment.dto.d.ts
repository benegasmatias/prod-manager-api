import { PaymentMethod } from '../../common/enums';
export declare class CreatePaymentDto {
    amount: number;
    method: PaymentMethod;
    reference?: string;
}
