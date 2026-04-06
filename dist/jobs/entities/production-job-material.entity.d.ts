import { ProductionJob } from './production-job.entity';
import { Material } from '../../materials/entities/material.entity';
export declare class ProductionJobMaterial {
    id: string;
    jobId: string;
    job: ProductionJob;
    materialId: string;
    material: Material;
    quantity: number;
    consumedQuantity: number;
    isReserved: boolean;
    createdAt: Date;
    updatedAt: Date;
}
