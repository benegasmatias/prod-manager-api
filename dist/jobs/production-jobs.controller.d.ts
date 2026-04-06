import { ProductionJobService } from './production-job.service';
import { CreateProductionJobsDto, AssignResourcesDto, UpdateJobStatusDto, UpdateJobPriorityDto, UpdateJobStageDto, AssignMaterialDto } from './dto/production-job.dto';
export declare class ProductionJobsController {
    private readonly jobService;
    constructor(jobService: ProductionJobService);
    createJobs(businessId: string, createDto: CreateProductionJobsDto): Promise<import("./entities/production-job.entity").ProductionJob[]>;
    findAll(businessId: string, filters: any): Promise<any>;
    findOne(businessId: string, id: string): Promise<import("./entities/production-job.entity").ProductionJob>;
    assign(businessId: string, id: string, assignDto: AssignResourcesDto): Promise<import("./entities/production-job.entity").ProductionJob>;
    updatePriority(businessId: string, id: string, priorityDto: UpdateJobPriorityDto): Promise<import("./entities/production-job.entity").ProductionJob>;
    updateStatus(businessId: string, id: string, statusDto: UpdateJobStatusDto): Promise<import("./entities/production-job.entity").ProductionJob>;
    updateStage(businessId: string, id: string, stageDto: UpdateJobStageDto): Promise<import("./entities/production-job.entity").ProductionJob>;
    addMaterial(businessId: string, id: string, materialDto: AssignMaterialDto): Promise<import("./entities/production-job.entity").ProductionJob>;
}
