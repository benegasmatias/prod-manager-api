import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { MachineStatus } from '../../common/enums';
export declare class Machine {
    id: string;
    businessId: string;
    name: string;
    model: string;
    nozzle: string;
    status: MachineStatus;
    maxFilaments: number;
    active: boolean;
    productionJobs: ProductionJob[];
    createdAt: Date;
    updatedAt: Date;
}
