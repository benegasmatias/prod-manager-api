import { ProductionJob } from './production-job.entity';
export declare class JobProgress {
    id: string;
    productionJobId: string;
    productionJob: ProductionJob;
    createdAt: Date;
    unitsDone: number;
    minutesDone: number;
    weightUsedG: number;
    note: string;
}
