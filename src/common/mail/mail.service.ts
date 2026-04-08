import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class MailService {
    private client: BrevoClient | null = null;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('BREVO_API_KEY');
        if (apiKey) {
            this.client = new BrevoClient({ apiKey });
        }
    }

    async sendInvitationEmail(toEmail: string, businessName: string, role: string, inviteUrl: string, userExists: boolean = false) {
        if (!this.client) {
            console.warn('⚠️ BREVO_API_KEY no configurada. Simulando envío de email...');
            console.log(`Para: ${toEmail}, Business: ${businessName}, Role: ${role}, URL: ${inviteUrl}`);
            return;
        }

        try {
            const data = await this.client.transactionalEmails.sendTransacEmail({
                subject: `Invitación a unirse a ${businessName} en ProdManager`,
                htmlContent: userExists ? `
                    <html>
                        <body>
                            <h1>¡Hola!</h1>
                            <p>Has sido invitado a unirte a <strong>${businessName}</strong> en la plataforma ProdManager con el rol de <strong>${role}</strong>.</p>
                            <p>Para aceptar la invitación y comenzar a trabajar, haz clic en el siguiente enlace:</p>
                            <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Aceptar Invitación</a>
                            <p>O copia y pega este enlace en tu navegador:</p>
                            <p>${inviteUrl}</p>
                            <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
                        </body>
                    </html>
                ` : `
                    <html>
                        <body>
                            <h1>¡Hola!</h1>
                            <p>Has sido invitado a unirte a <strong>${businessName}</strong> en la plataforma ProdManager con el rol de <strong>${role}</strong>.</p>
                            <p><strong>Aún no tienes cuenta en ProdManager.</strong> Para aceptar la invitación y comenzar a trabajar, primero debes crear tu cuenta haciendo clic en el siguiente enlace:</p>
                            <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Crear cuenta y Aceptar</a>
                            <p>O copia y pega este enlace en tu navegador:</p>
                            <p>${inviteUrl}</p>
                            <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
                        </body>
                    </html>
                `,
                sender: {
                    name: 'ProdManager',
                    email: this.configService.get<string>('BREVO_SENDER_EMAIL') || 'noreply@prodmanager.com.ar',
                },
                to: [{ email: toEmail }],
            });
            console.log('📧 Email enviado con éxito a:', toEmail, 'ID:', data.messageId);
            return data;
        } catch (error) {
            console.error('❌ Error al enviar email con Brevo:', error);
            throw new InternalServerErrorException('Error al enviar el email de invitación');
        }
    }
}
