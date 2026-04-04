import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';
import { ProductionJobStatus, ProductionJobPriority, OrderStatus } from '../common/enums';

@Injectable()
export class ProductionJobService {
    constructor(
        @InjectRepository(ProductionJob)
        private readonly jobRepository: Repository<ProductionJob>,
        @InjectRepository(OrderItem)
        private readonly itemRepository: Repository<OrderItem>,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(BusinessTemplate)
        private readonly templateRepository: Repository<BusinessTemplate>,
        private readonly dataSource: DataSource,
    ) { }

    async createJobsForOrder(businessId: string, orderId: string, itemIds?: string[]): Promise<ProductionJob[]> {
        // Fetch items that don't have a job yet
        const whereClause: any = { orderId };
        if (itemIds && itemIds.length > 0) {
            whereClause.id = In(itemIds);
        }

        const items = await this.itemRepository.find({
            where: whereClause,
            relations: ['productionJob', 'order']
        });

        const pendingItems = items.filter(item => !item.productionJob);
        if (pendingItems.length === 0) return [];

        const jobs: ProductionJob[] = [];

        await this.dataSource.transaction(async (manager) => {
            for (const item of pendingItems) {
                const job = manager.create(ProductionJob, {
                    businessId,
                    orderId,
                    orderItemId: item.id,
                    status: ProductionJobStatus.QUEUED,
                    priority: ProductionJobPriority.NORMAL,
                    estimatedMinutes: item.estimatedMinutes || 0,
                    sequence: 0,
                });
                jobs.push(await manager.save(job));
            }
        });

        return jobs;
    }

    async findAll(businessId: string, filters: any): Promise<any> {
        const query = this.jobRepository.createQueryBuilder('job')
            .leftJoinAndSelect('job.orderItem', 'item')
            .leftJoinAndSelect('job.machine', 'machine')
            .leftJoinAndSelect('job.operator', 'operator')
            .where('job.businessId = :businessId', { businessId });

        if (filters.status) query.andWhere('job.status = :status', { status: filters.status });
        if (filters.priority) query.andWhere('job.priority = :priority', { priority: filters.priority });
        if (filters.machineId) query.andWhere('job.machineId = :machineId', { machineId: filters.machineId });
        if (filters.operatorId) query.andWhere('job.operatorId = :operatorId', { operatorId: filters.operatorId });
        if (filters.orderId) query.andWhere('job.orderId = :orderId', { orderId: filters.orderId });

        query.orderBy('job.sequence', 'ASC').addOrderBy('job.createdAt', 'DESC');

        return query.getMany();
    }

    async findOne(businessId: string, id: string): Promise<ProductionJob> {
        const job = await this.jobRepository.findOne({
            where: { id, businessId },
            relations: ['orderItem', 'machine', 'operator', 'order']
        });
        if (!job) throw new NotFoundException('Trabajo de producción no encontrado');
        return job;
    }

    async assignResources(businessId: string, id: string, data: { operatorId?: string, machineId?: string }): Promise<ProductionJob> {
        const job = await this.findOne(businessId, id);
        
        if (data.operatorId !== undefined) job.operatorId = data.operatorId;
        if (data.machineId !== undefined) job.machineId = data.machineId;

        return this.jobRepository.save(job);
    }

    async updatePriority(businessId: string, id: string, priority: ProductionJobPriority): Promise<ProductionJob> {
        const job = await this.findOne(businessId, id);
        job.priority = priority;
        return this.jobRepository.save(job);
    }

    async updateStatus(businessId: string, id: string, status: ProductionJobStatus): Promise<ProductionJob> {
        const job = await this.findOne(businessId, id);
        const previousStatus = job.status;
        job.status = status;

        if (status === ProductionJobStatus.IN_PROGRESS && !job.startedAt) {
            job.startedAt = new Date();
        }

        if (status === ProductionJobStatus.DONE) {
            job.completedAt = new Date();
        }

        const saved = await this.jobRepository.save(job);

        // Sync with OrderItem/Order
        await this.syncItemStatus(saved);

        return saved;
    }

    async updateStage(businessId: string, id: string, stage: string): Promise<ProductionJob> {
        const job = await this.findOne(businessId, id);
        
        // Validation against Business Template Stages
        const business = await this.businessRepository.findOneBy({ id: businessId });
        const template = await this.templateRepository.findOneBy({ key: business.category });
        
        const allowedStages = template?.config?.stages || [];
        if (allowedStages.length > 0 && !allowedStages.includes(stage)) {
            throw new BadRequestException(`La etapa "${stage}" no es válida para el rubro ${business.category}`);
        }

        job.currentStage = stage;
        return this.jobRepository.save(job);
    }

    private async syncItemStatus(job: ProductionJob): Promise<void> {
        // If Job is DONE -> Item could be marked as DONE/READY in business terms
        // This logic will evolve, but for Stage 6.0:
        if (job.status === ProductionJobStatus.DONE) {
            // We could update OrderItem metadata or status if it had one
            // Orders usually track status at Order level, but items can have metadata.
            // Placeholder: Log sync
            console.log(`[ProductionSync] Job ${job.id} DONE. Syncing Item ${job.orderItemId}`);
        }
    }
}
