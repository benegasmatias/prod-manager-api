import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { PrinterStatus } from '../../common/enums';
export declare class Printer {
    id: string;
    businessId: string;
    name: string;
    model: string;
    nozzle: string;
    status: PrinterStatus;
    maxFilaments: number;
    active: boolean;
    productionJobs: ProductionJob[];
    createdAt: Date;
    updatedAt: Date;
}
