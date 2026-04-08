import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    businessId: string;

    @ValidateIf(o => o.email !== '' && o.email !== undefined && o.email !== null)
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateCustomerDto {
    @IsString()
    @IsOptional()
    name?: string;

    @ValidateIf(o => o.email !== '' && o.email !== undefined && o.email !== null)
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
