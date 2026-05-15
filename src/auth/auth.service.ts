import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private configService: ConfigService,
        private supabaseService: SupabaseService
    ) { }

    async verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
        const secretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');
        
        if (!secretKey) {
            console.error('[AuthService] ❌ TURNSTILE_SECRET_KEY no configurada');
            return true; 
        }

        try {
            console.log(`[AuthService] 🛡️ Verificando Captcha... (IP: ${remoteIp || 'desconocida'})`);
            
            // Usamos URLSearchParams que es más estándar para este tipo de peticiones en Node.js
            const params = new URLSearchParams();
            params.append('secret', secretKey);
            params.append('response', token);
            if (remoteIp) params.append('remoteip', remoteIp);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Aumentamos a 8s para ser más tolerantes

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
        // 1. Verify Captcha
        const isValid = await this.verifyTurnstile(dto.captchaToken, remoteIp);
        if (!isValid) {
            throw new BadRequestException('Captcha inválido o expirado. Por favor, intenta de nuevo.');
        }

        // 2. Proceed with registration via Supabase
        console.log(`[AuthService] 👤 Creando usuario en Supabase: ${dto.email}`);
        const supabase = this.supabaseService.getClient();
        
        const { data, error } = await supabase.auth.signUp({
            email: dto.email,
            password: dto.password,
            options: {
                data: dto.metadata || {},
                emailRedirectTo: dto.redirectTo
            }
        });

        if (error) {
            console.error('[AuthService] Supabase registration error:', error);
            throw new BadRequestException(error.message);
        }

        return {
            message: 'Registro iniciado. Por favor, verifica tu correo.',
            data
        };
    }
}
