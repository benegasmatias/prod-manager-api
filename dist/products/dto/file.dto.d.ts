import { FileType, ProductFileRole } from '../../common/enums';
export declare class CreateFileAssetDto {
    name: string;
    url: string;
    fileType: FileType;
    size?: number;
}
export declare class ProductFileDto {
    fileAssetId: string;
    role: ProductFileRole;
}
