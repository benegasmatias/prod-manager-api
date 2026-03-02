import { Repository } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { JobProgress } from './entities/job-progress.entity';
import { JobStatusHistory } from '../history/entities/job-status-history.entity';
import { OrdersService } from '../orders/orders.service';
import { CreateJobDto, CreateProgressDto, UpdateJobDto } from './dto/job.dto';
import { JobStatus } from '../common/enums';
export declare class JobsService {
    private readonly jobRepository;
    private readonly progressRepository;
    private readonly statusHistoryRepository;
    private readonly ordersService;
    constructor(jobRepository: Repository<ProductionJob>, progressRepository: Repository<JobProgress>, statusHistoryRepository: Repository<JobStatusHistory>, ordersService: OrdersService);
    create(createJobDto: CreateJobDto): Promise<ProductionJob>;
    getQueue(): Promise<ProductionJob[]>;
    findOne(id: string): Promise<ProductionJob>;
    updateStatus(id: string, status: JobStatus, note?: string): Promise<ProductionJob>;
    update(id: string, updateJobDto: UpdateJobDto): Promise<ProductionJob>;
    addProgress(id: string, createProgressDto: CreateProgressDto): Promise<ProductionJob>;
}
