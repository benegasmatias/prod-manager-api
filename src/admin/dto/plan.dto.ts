import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreatePlanDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsNumber()
    price: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    features?: string[];

    @IsOptional()
    @IsNumber()
    maxUsers?: number;

    @IsOptional()
    @IsNumber()
    maxOrdersPerMonth?: number;

    @IsOptional()
    @IsNumber()
    maxBusinesses?: number;

    @IsOptional()
    @IsNumber()
    maxMachines?: number;

    @IsOptional()
    @IsBoolean()
    isRecommended?: boolean;

    @IsOptional()
    @IsString()
    ctaText?: string;

    @IsOptional()
    @IsString()
    ctaLink?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsBoolean()
    hasTrial?: boolean;

    @IsOptional()
    @IsNumber()
    trialDays?: number;
}

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    features?: string[];

    @IsOptional()
    @IsNumber()
    maxUsers?: number;

    @IsOptional()
    @IsNumber()
    maxOrdersPerMonth?: number;

    @IsOptional()
    @IsNumber()
    maxBusinesses?: number;

    @IsOptional()
    @IsNumber()
    maxMachines?: number;

    @IsOptional()
    @IsBoolean()
    isRecommended?: boolean;

    @IsOptional()
    @IsString()
    ctaText?: string;

    @IsOptional()
    @IsString()
    ctaLink?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsBoolean()
    hasTrial?: boolean;

    @IsOptional()
    @IsNumber()
    trialDays?: number;
}
