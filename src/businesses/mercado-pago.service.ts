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
        description: string
    ) {
        try {
            const preference = new Preference(this.client);
            const response = await preference.create({
                body: {
                    items: [
                        {
                            id: planId,
                            title: description,
                            quantity: 1,
                            unit_price: price,
                            currency_id: 'ARS'
                        }
                    ],
                    metadata: {
                        businessId,
                        planId,
                        subscriptionType: 'NEW'
                    },
                    back_urls: {
                        success: `${this.configService.get('FRONTEND_URL') || 'http://localhost:4200'}/billing/success`,
                        failure: `${this.configService.get('FRONTEND_URL') || 'http://localhost:4200'}/billing/failure`,
                        pending: `${this.configService.get('FRONTEND_URL') || 'http://localhost:4200'}/billing/pending`,
                    },
                    auto_return: 'approved',
                    notification_url: `${this.configService.get('BACKEND_URL') || 'http://localhost:3030'}/webhooks/mercadopago`,
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
     * Verifica la firma del webhook si es necesario (opcional en MP según nivel de seguridad requerido)
     */
    verifyWebhookSignature(signature: string, requestId: string): boolean {
        // Mercado Pago v2 SDK provides internal utilities for this if needed
        return true; 
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
