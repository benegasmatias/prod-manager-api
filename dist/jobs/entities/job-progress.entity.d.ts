import { ProductionJob } from './production-job.entity';
import { User } from '../../users/entities/user.entity';
export declare class JobProgress {
    id: string;
    productionJobId: string;
    productionJob: ProductionJob;
    createdAt: Date;
    unitsDone: number;
    minutesDone: number;
    weightUsedG: number;
    note: string;
    performedById: string;
    performedBy: User;
}
