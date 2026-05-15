import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly apiKey: string;
    private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('BREVO_API_KEY');
        if (!this.apiKey) {
            this.logger.warn('⚠️ BREVO_API_KEY no configurada. Los emails no se enviarán.');
        }
    }

    async sendInvitationEmail(toEmail: string, businessName: string, role: string, inviteUrl: string, userExists: boolean = false) {
        const fromEmail = this.configService.get<string>('SMTP_FROM') || 'soporte@prodmanager.com.ar';
        const subject = `🚀 Invitación a unirse a ${businessName} en ProdManager`;
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a1a; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a1a; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #11142b; border-radius: 32px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.15); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                            <!-- HEADER CON BRAND COLOR -->
                            <tr>
                                <td align="center" style="padding: 50px 40px; background: linear-gradient(135deg, #742fe5 0%, #8b5cf6 100%);">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -0.02em; text-transform: none;">ProdManager</h1>
                                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">Gestión de Producción Inteligente</p>
                                </td>
                            </tr>
                            
                            <!-- CONTENIDO EXPLICATIVO -->
                            <tr>
                                <td style="padding: 48px 40px;">
                                    <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 26px; font-weight: 800; text-align: left; letter-spacing: -0.02em;">¡Hola! 👋</h2>
                                    
                                    <p style="margin: 0 0 24px; color: #cbd5e1; font-size: 16px; line-height: 1.7; text-align: left;">
                                        Has sido invitado por <strong>${businessName}</strong> para unirte a su equipo de trabajo con el rol de <span style="color: #a78bfa; font-weight: 700;">${role}</span>.
                                    </p>
                                    
                                    <div style="background-color: rgba(139, 92, 246, 0.05); border-left: 4px solid #8b5cf6; padding: 20px; margin-bottom: 32px; border-radius: 0 16px 16px 0;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                                            <strong>¿Qué es ProdManager?</strong><br>
                                            Es la plataforma donde centralizamos el seguimiento de pedidos, gestión de stock y flujos de producción para que todo el equipo trabaje en sintonía y de forma eficiente.
                                        </p>
                                    </div>
                                    
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" style="padding-top: 10px;">
                                                <a href="${inviteUrl}" style="display: inline-block; padding: 20px 40px; background-color: #ffffff; color: #742fe5; text-decoration: none; border-radius: 18px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 15px 30px rgba(116, 47, 229, 0.3);">
                                                    ${userExists ? 'Aceptar Invitación' : 'Completar mi Registro'}
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <div style="margin-top: 32px; padding: 20px; background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 16px;">
                                        <p style="margin: 0; color: #ef4444; font-size: 12px; line-height: 1.6; font-weight: 600; text-align: left;">
                                            ⚠️ POLÍTICA DE OPTIMIZACIÓN: Las cuentas inactivas por más de 15 días son dadas de baja automáticamente para optimizar recursos del sistema.
                                        </p>
                                    </div>
                                    
                                    <p style="margin: 40px 0 0; color: #64748b; font-size: 13px; text-align: center; line-height: 1.5;">
                                        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                        <span style="color: #8b5cf6;">${inviteUrl}</span>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 32px 40px; background-color: #0d0d1a; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                                    <p style="margin: 0; color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                                        © 2026 ProdManager • Potenciando la Fabricación Local
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        return this.sendMail(toEmail, subject, htmlContent);
    }

    private async sendMail(toEmail: string, subject: string, htmlContent: string) {
        if (!this.apiKey) {
            this.logger.warn(`No se envió el email a ${toEmail} porque no hay BREVO_API_KEY.`);
            return;
        }

        const fromEmail = this.configService.get<string>('SMTP_FROM') || 'soporte@prodmanager.com.ar';

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': this.apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: 'ProdManager',
                        email: fromEmail
                    },
                    to: [{
                        email: toEmail
                    }],
                    subject: subject,
                    htmlContent: htmlContent
                })
            });

            const data = await response.json();

            if (!response.ok) {
                this.logger.error(`Error de Brevo: ${JSON.stringify(data)}`);
                throw new Error(data.message || 'Error desconocido en Brevo');
            }

            this.logger.log(`📧 Email enviado con éxito vía Brevo a: ${toEmail}. MessageId: ${data.messageId}`);
            return data;
        } catch (error) {
            this.logger.error(`❌ Error al enviar email vía Brevo a ${toEmail}: ${error.message}`);
            throw new InternalServerErrorException(`Error de Email (Brevo): ${error.message}`);
        }
    }
}
