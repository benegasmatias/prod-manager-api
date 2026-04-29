import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateBusinessFromTemplateDto {
    @IsNotEmpty()
    @IsString()
    templateKey: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsObject()
    metadata?: any;
}
