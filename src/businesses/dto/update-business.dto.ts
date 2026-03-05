import { IsString, IsOptional } from 'class-validator';

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
    currency?: string;
}
