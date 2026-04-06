import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray, IsEnum, IsInt, IsNumber } from 'class-validator';
import { ProductionJobStatus, ProductionJobPriority } from '../../common/enums';

export class CreateProductionJobsDto {
    @IsUUID()
    @IsNotEmpty()
    orderId: string;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    itemIds?: string[];
}

export class AssignResourcesDto {
    @IsUUID()
    @IsOptional()
    operatorId?: string;

    @IsUUID()
    @IsOptional()
    machineId?: string;
}

export class UpdateJobStatusDto {
    @IsEnum(ProductionJobStatus)
    @IsNotEmpty()
    status: ProductionJobStatus;

    @IsString()
    @IsOptional()
    pauseReason?: string;
}

export class UpdateJobPriorityDto {
    @IsEnum(ProductionJobPriority)
    @IsNotEmpty()
    priority: ProductionJobPriority;
}

export class UpdateJobStageDto {
    @IsString()
    @IsNotEmpty()
    stage: string;
}

export class AssignMaterialDto {
    @IsUUID()
    @IsNotEmpty()
    materialId: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}
