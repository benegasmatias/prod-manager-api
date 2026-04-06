import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateDefaultBusinessDto {
    @IsNotEmpty()
    @IsUUID()
    businessId: string;
}
