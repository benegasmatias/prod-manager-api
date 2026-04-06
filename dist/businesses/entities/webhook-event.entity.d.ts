import { Business } from './business.entity';
import { WebhookStatus } from '../../common/enums';
export declare class WebhookEvent {
    id: string;
    providerEventId: string;
    provider: string;
    eventType: string;
    status: WebhookStatus;
    businessId: string;
    payload: any;
    errorMessage: string;
    receivedAt: Date;
    processedAt: Date;
    business: Business;
}
