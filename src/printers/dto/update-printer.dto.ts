import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePrinterDto {
    @IsString()
    @IsOptional()
    name?: string;

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
