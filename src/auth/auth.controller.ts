import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
        // Obtenemos la IP del usuario si es posible
        const remoteIp = req.ip || req.socket.remoteAddress;
        return this.authService.register(registerDto, remoteIp);
    }
}
