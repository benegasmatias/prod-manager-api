import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { JobStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class JobStatusHistory {
    id: string;
    productionJobId: string;
    productionJob: ProductionJob;
    changedAt: Date;
    fromStatus: JobStatus;
    toStatus: JobStatus;
    note: string;
    performedById: string;
    performedBy: User;
}
