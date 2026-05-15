import { Injectable, BadRequestException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { BusinessInvitationsService } from '../businesses/business-invitations.service';

@Injectable()
export class AuthService {
    constructor(
        private configService: ConfigService,
        private supabaseService: SupabaseService,
        private invitationsService: BusinessInvitationsService,
    ) { }

    async verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
        const secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');
        
        if (!secretKey) {
            console.error('[AuthService] ❌ TURNSTILE_SECRET_KEY no configurada');
            return true; 
        }

        try {
            console.log(`[AuthService] 🛡️ Verificando Captcha... (IP: ${remoteIp || 'desconocida'})`);
            
            const params = new URLSearchParams();
            params.append('secret', secretKey);
            params.append('response', token);
            if (remoteIp) params.append('remoteip', remoteIp);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); 

            const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const outcome = await response.json() as any;
            
            if (!outcome.success) {
                console.warn('[AuthService] ⚠️ Verificación de Turnstile fallida:', outcome['error-codes']);
                return false;
            }

            console.log('[AuthService] ✅ Captcha verificado con éxito');
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('[AuthService] ❌ Timeout verificando Turnstile (Cloudflare tardó demasiado)');
            } else {
                console.error('[AuthService] ❌ Error verificando Turnstile:', error);
            }
            throw new InternalServerErrorException('Error al verificar el captcha. Por favor reintenta.');
        }
    }

    async register(dto: RegisterDto, remoteIp?: string) {
        console.log(`[AuthService] 🚀 Iniciando registro para: ${dto.email}`);
        
        // 1. Verify Captcha
        const isValid = await this.verifyTurnstile(dto.captchaToken, remoteIp);
        if (!isValid) {
            throw new BadRequestException('Captcha inválido o expirado. Por favor, intenta de nuevo.');
        }

        const supabase = this.supabaseService.getClient();
        let invitation = null;

        // 2. Si hay token de invitación, validarlo
        if (dto.invitationToken) {
            try {
                console.log(`[AuthService] 🔍 Validando token de invitación: ${dto.invitationToken}`);
                invitation = await this.invitationsService.findByToken(dto.invitationToken);
                
                if (invitation.email.toLowerCase() !== dto.email.toLowerCase()) {
                    console.warn(`[AuthService] ❌ El email de la invitación (${invitation.email}) no coincide con ${dto.email}`);
                    throw new BadRequestException('Este enlace de invitación no corresponde al email proporcionado.');
                }
                console.log(`[AuthService] ✅ Invitación válida detectada para: ${dto.email}`);
            } catch (error) {
                console.warn('[AuthService] ⚠️ Intento de registro con token inválido o expirado:', dto.invitationToken);
                // Si el token es inválido, seguimos como registro normal pero no auto-confirmamos
            }
        }

        // 3. Crear usuario
        console.log(`[AuthService] 👤 Creando usuario en Supabase: ${dto.email} (Modo Invitación: ${!!invitation})`);
        
        let result;
        try {
            if (invitation) {
                // REGISTRO POR INVITACIÓN: Usamos el API de Admin para auto-confirmar el email
                const { data, error } = await supabase.auth.admin.createUser({
                    email: dto.email,
                    password: dto.password,
                    email_confirm: true,
                    user_metadata: dto.metadata || {}
                });
                
                if (error) {
                    console.error('[AuthService] ❌ Error en admin.createUser:', error.message);
                    throw new BadRequestException(error.message);
                }
                
                result = { data, error };
                
                // 4. ACEPTAR INVITACIÓN AUTOMÁTICAMENTE
                try {
                    console.log(`[AuthService] 🤝 Aceptando invitación automáticamente para el usuario: ${data.user.id}`);
                    await this.invitationsService.acceptInvitation(
                        dto.invitationToken, 
                        data.user.id, 
                        dto.email
                    );
                    console.log(`[AuthService] 🎉 Invitación aceptada con éxito`);
                } catch (acceptError) {
                    console.error('[AuthService] ❌ Error al aceptar invitación:', acceptError.message);
                    // No lanzamos excepción aquí para no romper el registro si ya se creó el usuario
                }

            } else {
                // REGISTRO NORMAL: Requiere confirmación de email estándar
                console.log(`[AuthService] 📧 Enviando email de confirmación para: ${dto.email}`);
                const { data, error } = await supabase.auth.signUp({
                    email: dto.email,
                    password: dto.password,
                    options: {
                        data: dto.metadata || {},
                        emailRedirectTo: dto.redirectTo
                    }
                });
                
                if (error) {
                    console.error('[AuthService] ❌ Error en auth.signUp:', error.message);
                    throw new BadRequestException(error.message);
                }
                
                result = { data, error };
            }
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            console.error('[AuthService] 💥 Error inesperado durante el registro:', error);
            throw new InternalServerErrorException('Error al procesar el registro. Por favor, intenta de nuevo.');
        }

        return {
            message: invitation 
                ? 'Cuenta creada y vinculada con éxito. Ya puedes iniciar sesión.' 
                : 'Registro iniciado. Por favor, verifica tu correo.',
            isInvitation: !!invitation,
            data: result.data
        };
    }
}
