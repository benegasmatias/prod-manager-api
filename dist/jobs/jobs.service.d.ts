import { Repository } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { JobProgress } from './entities/job-progress.entity';
import { JobStatusHistory } from '../history/entities/job-status-history.entity';
import { OrdersService } from '../orders/orders.service';
import { CreateJobDto, CreateProgressDto, UpdateJobDto } from './dto/job.dto';
import { JobStatus } from '../common/enums';
import { Printer } from '../printers/entities/printer.entity';
import { Material } from '../materials/entities/material.entity';
export declare class JobsService {
    private readonly jobRepository;
    private readonly progressRepository;
    private readonly statusHistoryRepository;
    private readonly printerRepository;
    private readonly materialRepository;
    private readonly ordersService;
    constructor(jobRepository: Repository<ProductionJob>, progressRepository: Repository<JobProgress>, statusHistoryRepository: Repository<JobStatusHistory>, printerRepository: Repository<Printer>, materialRepository: Repository<Material>, ordersService: OrdersService);
    create(createJobDto: CreateJobDto, userId?: string): Promise<ProductionJob>;
    getQueue(businessId?: string): Promise<ProductionJob[]>;
    findOne(id: string): Promise<ProductionJob>;
    updateStatus(id: string, status: JobStatus, note?: string, userId?: string): Promise<ProductionJob>;
    update(id: string, updateJobDto: UpdateJobDto, userId?: string): Promise<ProductionJob>;
    addProgress(id: string, createProgressDto: CreateProgressDto, userId?: string): Promise<ProductionJob>;
    private deductMaterialWeight;
}
