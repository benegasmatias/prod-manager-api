import { IsString, IsOptional, IsBoolean, IsObject, IsUUID } from 'class-validator';

export class CreateCalibrationDto {
    @IsUUID()
    machineId: string;

    @IsUUID()
    @IsOptional()
    materialId?: string;

    @IsString()
    testType: string;

    @IsObject()
    @IsOptional()
    results?: any;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsBoolean()
    @IsOptional()
    success?: boolean;
}
