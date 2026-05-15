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
        const subject = `Invitación a unirse a ${businessName} en ProdManager`;
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0a0a0c; margin: 0; padding: 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0c; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111114; border-radius: 24px; overflow: hidden; border: 1px solid #1f1f23;">
                            <!-- HEADER -->
                            <tr>
                                <td align="center" style="padding: 40px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">ProdManager</h1>
                                </td>
                            </tr>
                            <!-- CONTENT -->
                            <tr>
                                <td style="padding: 48px 40px;">
                                    <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 24px; font-weight: 800; text-align: center; letter-spacing: -0.02em;">¡HOLA!</h2>
                                    <p style="margin: 0 0 32px; color: #a1a1aa; font-size: 16px; line-height: 1.6; text-align: center;">
                                        Has sido invitado a formar parte del equipo de <strong>${businessName}</strong> como <strong>${role}</strong>.
                                    </p>
                                    
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center">
                                                <a href="${inviteUrl}" style="display: inline-block; padding: 18px 36px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
                                                    ${userExists ? 'ACEPTAR INVITACIÓN' : 'COMPLETAR REGISTRO'}
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 32px 40px; background-color: #0d0d10; border-top: 1px solid #1f1f23; text-align: center;">
                                    <p style="margin: 0; color: #52525b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                                        © 2026 ProdManager • Sistema de Gestión de Producción
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
