import { JobsService } from './jobs.service';
import { CreateJobDto, CreateProgressDto, UpdateJobDto } from './dto/job.dto';
import { JobStatus } from '../common/enums';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    create(createJobDto: CreateJobDto): Promise<import("./entities/production-job.entity").ProductionJob>;
    getQueue(): Promise<import("./entities/production-job.entity").ProductionJob[]>;
    findOne(id: string): Promise<import("./entities/production-job.entity").ProductionJob>;
    updateStatus(id: string, status: JobStatus, notes?: string): Promise<import("./entities/production-job.entity").ProductionJob>;
    update(id: string, updateJobDto: UpdateJobDto): Promise<import("./entities/production-job.entity").ProductionJob>;
    addProgress(id: string, createProgressDto: CreateProgressDto): Promise<import("./entities/production-job.entity").ProductionJob>;
}
