import { IsEmail, IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @IsString()
    @IsNotEmpty()
    captchaToken: string;

    @IsString()
    @IsOptional()
    redirectTo?: string;
}
