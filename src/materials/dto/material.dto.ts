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
}
