import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { JobStatus } from '../../common/enums';
export declare class JobStatusHistory {
    id: string;
    productionJobId: string;
    productionJob: ProductionJob;
    changedAt: Date;
    fromStatus: JobStatus;
    toStatus: JobStatus;
    note: string;
}
