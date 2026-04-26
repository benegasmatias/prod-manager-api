import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, ValidateIf } from 'class-validator';

export class CreateMaterialDto {
    @IsString()
    name: string;

    @IsString()
    type: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsNumber()
    @IsOptional()
    costPerKg?: number;

    @IsUUID()
    businessId: string;

    @IsNumber()
    @IsOptional()
    totalWeightGrams?: number;

    @IsNumber()
    @IsOptional()
    remainingWeightGrams?: number;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsNumber()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    bedTemperature?: number;

    @IsNumber()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    nozzleTemperature?: number;

    @IsOptional()
    attributes?: Record<string, string | number | boolean | null>;
}

export class UpdateMaterialDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsUUID()
    @IsOptional()
    businessId?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsNumber()
    @IsOptional()
    costPerKg?: number;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsNumber()
    @IsOptional()
    totalWeightGrams?: number;

    @IsNumber()
    @IsOptional()
    remainingWeightGrams?: number;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsNumber()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    bedTemperature?: number;

    @IsNumber()
    @IsOptional()
    @ValidateIf((o, v) => v !== null)
    nozzleTemperature?: number;

    @IsOptional()
    attributes?: Record<string, string | number | boolean | null>;
}

export interface MaterialFormFieldSchema {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'color' | 'checkbox';
    required: boolean;
    placeholder?: string;
    options?: { label: string, value: any }[];
    industry?: string;
}
