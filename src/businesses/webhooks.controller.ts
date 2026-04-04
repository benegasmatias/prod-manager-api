import { Controller, Post, Body, Headers, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly billingService: BillingService) { }

    @Post('stripe')
    @HttpCode(HttpStatus.OK)
    async handleStripe(@Body() payload: any, @Headers('stripe-signature') signature: string) {
        if (!signature && process.env.NODE_ENV === 'production') {
            throw new BadRequestException('Mising signature');
        }

        // 1. Registro rápido (Idempotencia inmediata)
        // En un flujo real, extraeríamos el businessId de plan/metadata del payload
        const eventId = payload.id;
        const eventType = payload.type;
        const businessId = payload.data?.object?.metadata?.businessId; 

        const webhookRecord = await this.billingService.recordWebhookEvent(
            'STRIPE',
            eventId,
            eventType,
            payload,
            businessId
        );

        // 2. Procesamiento (En fase 5.3 se hace síncrono tras el save por simplicidad, 
        // pero el diseño ya lo separa para moverlo a una Queue si escala)
        try {
            await this.billingService.processSubscriptionEvent(webhookRecord.id);
        } catch (error) {
            // Logueamos pero respondemos 200 para evitar reintentos infinitos si el error es de lógica interna
            console.error('[Webhooks] Error processing event:', eventId, error.message);
        }

        return { received: true };
    }

    @Post('mercadopago')
    @HttpCode(HttpStatus.OK)
    async handleMP(@Body() payload: any) {
        const eventId = payload.id || payload.data?.id;
        const eventType = payload.type || payload.action;

        const webhookRecord = await this.billingService.recordWebhookEvent(
            'MERCADOPAGO',
            eventId,
            eventType,
            payload
        );

        // MercadoPago logic would go here
        return { received: true };
    }
}
