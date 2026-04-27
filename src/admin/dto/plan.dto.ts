import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Allow } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePlanDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    @Allow()
    category?: string | null;

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

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    promoPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    promoDurationMonths?: number;

    @IsOptional()
    @IsString()
    promoLabel?: string;

    @IsOptional()
    metadata?: any;

}

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    @Allow()
    category?: string | null;

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

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    promoPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    promoDurationMonths?: number;

    @IsOptional()
    @IsString()
    promoLabel?: string;

    @IsOptional()
    metadata?: any;

}
