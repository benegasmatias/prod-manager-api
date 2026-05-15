import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT') || 465;
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465, // true for 465, false for other ports
                auth: {
                    user,
                    pass,
                },
                tls: {
                    // Do not fail on invalid certs (common with some hosting providers)
                    rejectUnauthorized: false
                },
                // Forzamos IPv4 para evitar errores de red (ENETUNREACH) en entornos como Render
                family: 4,
                // Activamos logs detallados para diagnosticar el timeout en Render
                logger: true,
                debug: true
            } as any);
            this.logger.log(`SMTP Mailer configurado en ${host}:${port}`);
        } else {
            this.logger.warn('⚠️ Configuración SMTP incompleta. Los emails se loguearán en consola.');
        }
    }

    async sendInvitationEmail(toEmail: string, businessName: string, role: string, inviteUrl: string, userExists: boolean = false) {
        const from = this.configService.get<string>('SMTP_FROM') || 'noreply@prodmanager.com.ar';
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
                                <td style="padding: 40px; color: #e2e2e7;">
                                    <h2 style="color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">¡Invitación a Colaborar!</h2>
                                    <p style="font-size: 16px; color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">Hola,</p>
                                    <p style="font-size: 16px; color: #94a3b8; margin-bottom: 24px; line-height: 1.6;">
                                        Has sido invitado a unirte al equipo de <strong>${businessName}</strong> como <strong>${role}</strong>. 
                                        ${userExists ? 'Solo tenés que aceptar la invitación para comenzar.' : 'Como aún no tenés cuenta, el primer paso es registrarte para aceptar el acceso.'}
                                    </p>
                                    
                                    <div style="text-align: center; margin: 40px 0;">
                                        <a href="${inviteUrl}" style="display: inline-block; padding: 18px 36px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
                                            ${userExists ? 'Aceptar Invitación' : 'Crear Cuenta y Unirme'}
                                        </a>
                                    </div>
                                    
                                    <p style="font-size: 13px; color: #475569; margin-top: 40px; line-height: 1.6; word-break: break-all;">
                                        Si el botón no funciona, podés copiar este enlace: <br>
                                        <span style="color: #7c3aed;">${inviteUrl}</span>
                                    </p>
                                    
                                    <p style="font-size: 14px; color: #475569; margin-top: 24px; line-height: 1.6;">Si no esperabas este correo, podés ignorarlo con total seguridad.</p>
                                    <p style="font-size: 16px; color: #e2e2e7; font-weight: 700; margin-top: 24px;">Saludos,<br>El equipo de ProdManager</p>
                                </td>
                            </tr>
                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 30px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1f1f23;">
                                    © 2024 ProdManager Inc. • Arquitectura de Sistemas de Producción.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        if (!this.transporter) {
            this.logger.warn(`[SIMULACIÓN] Email para ${toEmail}: ${subject}`);
            this.logger.debug(`URL: ${inviteUrl}`);
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"ProdManager" <${from}>`,
                to: toEmail,
                subject: subject,
                html: htmlContent,
            });
            this.logger.log(`📧 Email enviado con éxito a: ${toEmail}. MessageId: ${info.messageId}`);
            return info;
        } catch (error) {
            this.logger.error(`❌ Error al enviar email a ${toEmail}: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Error SMTP: ${error.message}`);
        }
    }
}
