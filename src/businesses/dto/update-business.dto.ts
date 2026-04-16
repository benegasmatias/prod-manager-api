import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBusinessDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    taxId?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    acceptingOrders?: boolean;

    @IsBoolean()
    @IsOptional()
    onboardingCompleted?: boolean;

    @IsString()
    @IsOptional()
    onboardingStep?: string;
}
