import { JobStatus, Priority } from '../../common/enums';
export declare class CreateJobDto {
    orderId: string;
    orderItemId: string;
    printerId?: string;
    materialId?: string;
    totalUnits: number;
    priority?: Priority;
    sortRank?: number;
    title?: string;
    responsableId?: string;
}
export declare class UpdateJobDto {
    status?: JobStatus;
    priority?: Priority;
    sortRank?: number;
    printerId?: string;
    materialId?: string;
    notes?: string;
    responsableId?: string;
}
export declare class CreateProgressDto {
    unitsDone: number;
    note?: string;
}
