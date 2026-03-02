import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { FileType, ProductFileRole } from '../../common/enums';

export class CreateFileAssetDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsUrl()
    @IsNotEmpty()
    url: string;

    @IsEnum(FileType)
    fileType: FileType;

    @IsNumber()
    @IsOptional()
    size?: number;
}

export class ProductFileDto {
    @IsString()
    @IsNotEmpty()
    fileAssetId: string;

    @IsEnum(ProductFileRole)
    role: ProductFileRole;
}
