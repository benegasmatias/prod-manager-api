import { BillingService } from './billing.service';
export declare class WebhooksController {
    private readonly billingService;
    constructor(billingService: BillingService);
    handleStripe(payload: any, signature: string): Promise<{
        received: boolean;
    }>;
    handleMP(payload: any): Promise<{
        received: boolean;
    }>;
}
