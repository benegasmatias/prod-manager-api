import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CustomerListItemDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsDateString()
    createdAt: string;

    @IsNumber()
    totalOrders: number;
}

export class CustomerListResponseDto {
    items: CustomerListItemDto[];
    total: number;
    page: number;
    limit: number;
}
