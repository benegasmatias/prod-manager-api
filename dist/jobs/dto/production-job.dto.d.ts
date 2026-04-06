import { ProductionJobStatus, ProductionJobPriority } from '../../common/enums';
export declare class CreateProductionJobsDto {
    orderId: string;
    itemIds?: string[];
}
export declare class AssignResourcesDto {
    operatorId?: string;
    machineId?: string;
}
export declare class UpdateJobStatusDto {
    status: ProductionJobStatus;
    pauseReason?: string;
}
export declare class UpdateJobPriorityDto {
    priority: ProductionJobPriority;
}
export declare class UpdateJobStageDto {
    stage: string;
}
export declare class AssignMaterialDto {
    materialId: string;
    quantity: number;
}
