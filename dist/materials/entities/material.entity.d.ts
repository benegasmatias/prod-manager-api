import { MaterialType } from '../../common/enums';
import { ProductionJob } from '../../jobs/entities/production-job.entity';
export declare class Material {
    id: string;
    name: string;
    type: MaterialType;
    brand: string;
    color: string;
    costPerKg: number;
    businessId: string;
    totalWeightGrams: number;
    remainingWeightGrams: number;
    bedTemperature?: number;
    nozzleTemperature?: number;
    unit: string;
    active: boolean;
    productionJobs: ProductionJob[];
}
