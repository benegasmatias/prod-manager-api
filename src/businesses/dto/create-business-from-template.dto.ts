import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateBusinessFromTemplateDto {
    @IsNotEmpty()
    @IsString()
    templateKey: string;

    @IsOptional()
    @IsString()
    name?: string;
}
