import { JobStatus, Priority } from '../../common/enums';
export declare class CreateJobDto {
    orderId: string;
    orderItemId: string;
    machineId?: string;
    materialId?: string;
    totalUnits: number;
    priority?: Priority;
    sortRank?: number;
    title?: string;
    responsableId?: string;
    metadata?: any;
}
export declare class UpdateJobDto {
    status?: JobStatus;
    priority?: Priority;
    sortRank?: number;
    machineId?: string;
    materialId?: string;
    notes?: string;
    responsableId?: string;
    metadata?: any;
}
export declare class CreateProgressDto {
    unitsDone: number;
    note?: string;
}
