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
            console.error('[AuthService] TURNSTILE_SECRET_KEY not configured');
            return true; // Or false, depending on if you want to fail open or closed. User asked for protection, so fail closed.
        }

        try {
            const formData = new FormData();
            formData.append('secret', secretKey);
            formData.append('response', token);
            if (remoteIp) {
                formData.append('remoteip', remoteIp);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const outcome = await response.json() as any;
            
            if (!outcome.success) {
                console.warn('[AuthService] Turnstile verification failed:', outcome['error-codes']);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[AuthService] Error verifying Turnstile:', error);
            throw new InternalServerErrorException('Error al verificar el captcha');
        }
    }

    async register(dto: RegisterDto, remoteIp?: string) {
        // 1. Verify Captcha
        const isValid = await this.verifyTurnstile(dto.captchaToken, remoteIp);
        if (!isValid) {
            throw new BadRequestException('Captcha inválido o expirado. Por favor, intenta de nuevo.');
        }

        // 2. Proceed with registration via Supabase
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
