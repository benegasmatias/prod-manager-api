import { IsString, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    category?: string;

    @Type(() => Number)
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
    @Type(() => Number)
    @IsNumber()
    maxUsers?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxOrdersPerMonth?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxBusinesses?: number;

    @IsOptional()
    @Type(() => Number)
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
    @Type(() => Number)
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsBoolean()
    hasTrial?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    trialDays?: number;
}

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @Type(() => Number)
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
    @Type(() => Number)
    @IsNumber()
    maxUsers?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxOrdersPerMonth?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxBusinesses?: number;

    @IsOptional()
    @Type(() => Number)
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
    @Type(() => Number)
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsBoolean()
    hasTrial?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    trialDays?: number;
}
