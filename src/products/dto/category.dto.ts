import { IsNotEmpty, IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductCategoryDto {
    @IsUUID()
    @IsNotEmpty()
    businessId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsInt()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    sortOrder?: number;
}

export class UpdateProductCategoryDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsInt()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    sortOrder?: number;
}
