import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateMachineDto {
    @IsUUID()
    businessId: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsString()
    @IsOptional()
    nozzle?: string;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsOptional()
    maxFilaments?: number;
}
