import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, IsUUID } from 'class-validator';
import { ProductionJobStatus as JobStatus, Priority } from '../../common/enums';

export class CreateJobDto {
    @IsUUID()
    @IsOptional()
    businessId?: string;

    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsString()
    @IsNotEmpty()
    orderItemId: string;

    @IsString()
    @IsOptional()
    machineId?: string;

    @IsString()
    @IsOptional()
    materialId?: string;

    @IsInt()
    @Min(1)
    totalUnits: number;

    @IsEnum(Priority)
    @IsOptional()
    priority?: Priority;

    @IsInt()
    @IsOptional()
    sortRank?: number;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    operatorId?: string;

    @IsOptional()
    metadata?: any;
}

export class UpdateJobDto {
    @IsEnum(JobStatus)
    @IsOptional()
    status?: JobStatus;

    @IsEnum(Priority)
    @IsOptional()
    priority?: Priority;

    @IsInt()
    @IsOptional()
    sortRank?: number;

    @IsString()
    @IsOptional()
    machineId?: string;

    @IsString()
    @IsOptional()
    materialId?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    operatorId?: string;

    @IsOptional()
    metadata?: any;
}

export class CreateProgressDto {
    @IsInt()
    @Min(1)
    unitsDone: number;

    @IsString()
    @IsOptional()
    note?: string;
}
