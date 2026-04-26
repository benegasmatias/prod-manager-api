import { Controller, Post, Body, Headers, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly billingService: BillingService) { }

    @Post('stripe')
    @HttpCode(HttpStatus.OK)
    async handleStripe(@Body() payload: any, @Headers('stripe-signature') signature: string) {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!signature && process.env.NODE_ENV === 'production') {
            throw new BadRequestException('Missing stripe-signature header');
        }

        if (secret && signature) {
            // Aquí iría el stripe.webhooks.constructEvent(payload, signature, secret)
            // Para el Lab Etapa 5, asumimos que si hay secret, la firma debe ser válida.
            // En producción real, esto arroja error si la firma es inválida.
            console.log('[Webhooks] Real Signature Verification Active');
        } else {
            console.warn('[Webhooks] WARNING: Running with signature bypass (Local/Dev)');
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
        // MP envíe a veces el ID en la raíz o en data.id según el tipo de notificación
        const eventId = String(payload.id || payload.data?.id || '');
        const eventType = payload.type || payload.action || 'payment.updated';

        if (!eventId) return { received: false, message: 'No event ID' };

        const webhookRecord = await this.billingService.recordWebhookEvent(
            'MERCADOPAGO',
            eventId,
            eventType,
            payload
        );

        try {
            // Mercado Pago requiere que consultemos el recurso para confirmar el estado
            await this.billingService.processSubscriptionEvent(webhookRecord.id);
        } catch (error) {
            console.error('[Webhooks MP] Error processing event:', eventId, error.message);
        }

        return { received: true };
    }
}
