import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
    private readonly logger = new Logger(MercadoPagoService.name);
    private client: MercadoPagoConfig;

    constructor(private configService: ConfigService) {
        const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
        this.client = new MercadoPagoConfig({ 
            accessToken: accessToken || '',
            options: { timeout: 5000 }
        });
    }

    /**
     * Crea una preferencia de pago para una suscripción.
     * @param businessId ID del negocio que realiza el pago.
     * @param planId ID del plan (ej: 'PRO', 'ENTERPRISE').
     * @param price Precio del plan.
     * @param description Descripción que verá el usuario.
     */
    async createSubscriptionPreference(
        businessId: string, 
        planId: string, 
        price: number,
        description: string,
        email: string
    ) {
        const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'https://app.prodmanager.com.ar').replace(/\/$/, '');
        try {
            const preference = new Preference(this.client);
            const response = await preference.create({
                body: {
                    items: [
                        {
                            id: planId,
                            title: description,
                            quantity: 1,
                            unit_price: Number(price),
                            currency_id: 'ARS'
                        }
                    ],
                    payer: {
                        email: email
                    },
                    metadata: {
                        businessId,
                        planId,
                        subscriptionType: 'NEW'
                    },
                    back_urls: {
                        success: `${frontendUrl}/billing/success`,
                        failure: `${frontendUrl}/billing/failure`,
                        pending: `${frontendUrl}/billing/pending`
                    },
                    auto_return: 'approved',
                    notification_url: (this.configService.get('BACKEND_URL') || 'https://api.prodmanager.com.ar').replace(/\/$/, '') + '/webhooks/mercadopago',
                }
            });

            return {
                preferenceId: response.id,
                initPoint: response.init_point,
                sandboxInitPoint: response.sandbox_init_point
            };
        } catch (error) {
            this.logger.error(`Error creating MP preference for business ${businessId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifica la firma del webhook de Mercado Pago.
     * Basado en HMAC SHA256 usando el Webhook Secret.
     */
    verifyWebhookSignature(xSignature: string, xRequestId: string): boolean {
        const secret = this.configService.get<string>('MP_WEBHOOK_SECRET');
        if (!secret) {
            this.logger.warn('MP_WEBHOOK_SECRET not configured. Skipping signature verification.');
            return true; 
        }

        if (!xSignature) return false;

        try {
            // Mercado Pago v2 format: ts=...,v1=...
            const parts = xSignature.split(',');
            const tsPart = parts.find(p => p.startsWith('ts='));
            const hashPart = parts.find(p => p.startsWith('v1='));

            if (!tsPart || !hashPart) return false;

            const ts = tsPart.split('=')[1];
            const receivedHash = hashPart.split('=')[1];

            // Manifest string for HMAC
            const manifest = `id:${xRequestId};ts:${ts};`;
            
            const crypto = require('crypto');
            const calculatedHash = crypto
                .createHmac('sha256', secret)
                .update(manifest)
                .digest('hex');

            return receivedHash === calculatedHash;
        } catch (error) {
            this.logger.error('Error verifying MP signature:', error.message);
            return false;
        }
    }

    /**
     * Obtiene los detalles de un pago por su ID.
     */
    async getPayment(paymentId: string) {
        try {
            const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.configService.get('MP_ACCESS_TOKEN')}`
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            this.logger.error(`Error fetching MP payment ${paymentId}: ${error.message}`);
            throw error;
        }
    }
}
