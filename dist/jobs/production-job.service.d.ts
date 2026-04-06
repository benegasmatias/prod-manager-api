import { Repository, DataSource } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';
import { OrderWorkflowService } from '../orders/order-workflow.service';
import { ProductionJobStatus, ProductionJobPriority } from '../common/enums';
import { ProductionJobMaterial } from './entities/production-job-material.entity';
import { Material } from '../materials/entities/material.entity';
export declare class ProductionJobService {
    private readonly jobRepository;
    private readonly itemRepository;
    private readonly businessRepository;
    private readonly templateRepository;
    private readonly jobMaterialRepository;
    private readonly materialRepository;
    private readonly workflowService;
    private readonly dataSource;
    constructor(jobRepository: Repository<ProductionJob>, itemRepository: Repository<OrderItem>, businessRepository: Repository<Business>, templateRepository: Repository<BusinessTemplate>, jobMaterialRepository: Repository<ProductionJobMaterial>, materialRepository: Repository<Material>, workflowService: OrderWorkflowService, dataSource: DataSource);
    createJobsForOrder(businessId: string, orderId: string, itemIds?: string[]): Promise<ProductionJob[]>;
    findAll(businessId: string, filters: any): Promise<any>;
    findOne(businessId: string, id: string): Promise<ProductionJob>;
    assignResources(businessId: string, id: string, data: {
        operatorId?: string;
        machineId?: string;
    }): Promise<ProductionJob>;
    updatePriority(businessId: string, id: string, priority: ProductionJobPriority): Promise<ProductionJob>;
    updateStatus(businessId: string, id: string, status: ProductionJobStatus): Promise<ProductionJob>;
    updateStage(businessId: string, id: string, stage: string): Promise<ProductionJob>;
    private canTransitionStatus;
    private syncItemStatus;
    assignMaterial(businessId: string, jobId: string, data: {
        materialId: string;
        quantity: number;
    }): Promise<ProductionJob>;
    private consumeMaterials;
}
