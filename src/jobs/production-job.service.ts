import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';
import { OrderWorkflowService } from '../orders/order-workflow.service';
import { ProductionJobStatus, ProductionJobPriority, OrderStatus, OrderItemStatus } from '../common/enums';
import { ProductionJobMaterial } from './entities/production-job-material.entity';
import { Material } from '../materials/entities/material.entity';

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
        @InjectRepository(ProductionJobMaterial)
        private readonly jobMaterialRepository: Repository<ProductionJobMaterial>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        @InjectRepository(Machine)
        private readonly machineRepository: Repository<Machine>,
        private readonly workflowService: OrderWorkflowService,
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

        // Validar consistencia global de la orden
        const inconsistentItems = items.filter(i => i.orderId !== orderId);
        if (inconsistentItems.length > 0) {
            throw new BadRequestException('Uno o más ítems no pertenecen a la orden especificada.');
        }

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
            .leftJoinAndSelect('job.order', 'order')
            .leftJoinAndSelect('job.material', 'material')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.responsableGeneral', 'responsableGeneral')
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
            relations: ['orderItem', 'machine', 'operator', 'order', 'jobMaterials', 'jobMaterials.material']
        });
        if (!job) throw new NotFoundException('Trabajo de producción no encontrado');
        return job;
    }

    async assignResources(businessId: string, id: string, data: { operatorId?: string, machineId?: string }): Promise<ProductionJob> {
        const job = await this.jobRepository.findOne({
            where: { id, businessId },
            select: ['id', 'machineId', 'status', 'orderItemId']
        });
        if (!job) throw new NotFoundException('Trabajo de producción no encontrado');

        const oldMachineId = job.machineId;
        
        if (data.operatorId !== undefined) job.operatorId = data.operatorId;
        if (data.machineId !== undefined) job.machineId = data.machineId;

        const saved = await this.jobRepository.save(job);

        // SYNC MACHINE STATUS
        // 1. Release old machine if it was changed or removed
        if (oldMachineId && oldMachineId !== data.machineId) {
            await this.machineRepository.update(oldMachineId, { status: MachineStatus.IDLE });
        }

        // 2. Mark new machine as busy if assigned
        if (data.machineId) {
            await this.machineRepository.update(data.machineId, { status: MachineStatus.PRINTING });
        }

        return this.findOne(businessId, id);
    }

    async updatePriority(businessId: string, id: string, priority: ProductionJobPriority): Promise<ProductionJob> {
        const job = await this.findOne(businessId, id);
        job.priority = priority;
        return this.jobRepository.save(job);
    }

    async updateStatus(businessId: string, id: string, status: ProductionJobStatus): Promise<ProductionJob> {
        // Light load for validation and initial state
        const job = await this.jobRepository.findOne({
            where: { id, businessId },
            select: ['id', 'status', 'lastStartedAt', 'startedAt', 'actualMinutes', 'orderItemId', 'orderId', 'machineId']
        });
        
        if (!job) throw new NotFoundException('Trabajo de producción no encontrado');

        if (!this.canTransitionStatus(job.status, status)) {
            throw new BadRequestException(`Transición de estado inválida: de ${job.status} a ${status}`);
        }

        const oldStatus = job.status;
        job.status = status;

        const now = new Date();
        
        // 1. Moving AWAY from IN_PROGRESS (Accumulate time)
        if (oldStatus === ProductionJobStatus.IN_PROGRESS && job.lastStartedAt) {
            const diffInMs = now.getTime() - new Date(job.lastStartedAt).getTime();
            const diffInMins = Math.round(diffInMs / 60000);
            job.actualMinutes = (job.actualMinutes || 0) + Math.max(1, diffInMins);
            job.lastStartedAt = null;
        }

        // 2. Moving TO IN_PROGRESS (Start/Resume timer)
        if (status === ProductionJobStatus.IN_PROGRESS) {
            job.lastStartedAt = now;
            if (!job.startedAt) job.startedAt = now;
            
            // Sync Machine Status
            if (job.machineId) {
                await this.machineRepository.update(job.machineId, { status: MachineStatus.PRINTING });
            }
        }

        if (status === ProductionJobStatus.DONE || status === ProductionJobStatus.FAILED || status === ProductionJobStatus.CANCELLED) {
            if (status === ProductionJobStatus.DONE) job.completedAt = now;
            
            // Sync Machine Status (Release)
            if (job.machineId) {
                await this.machineRepository.update(job.machineId, { status: MachineStatus.IDLE });
            }

            if (status === ProductionJobStatus.DONE) {
                // Load materials ONLY when needed
                const jobWithMaterials = await this.jobRepository.findOne({
                    where: { id },
                    relations: ['jobMaterials', 'jobMaterials.material']
                });
                if (jobWithMaterials) {
                    await this.consumeMaterials(jobWithMaterials);
                }
            }
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
        
        if (!template) {
            throw new ForbiddenException(`El negocio no tiene un rubro (template) configurado para fabricación.`);
        }

        const allowedStages = template.config?.stages || [];
        if (allowedStages.length === 0) {
            throw new BadRequestException(`El rubro "${business.category}" no tiene etapas de producción definidas.`);
        }

        if (!allowedStages.includes(stage)) {
            throw new BadRequestException(`La etapa "${stage}" no es válida para el rubro ${business.category}`);
        }

        job.currentStage = stage;
        return this.jobRepository.save(job);
    }

    private canTransitionStatus(current: ProductionJobStatus, target: ProductionJobStatus): boolean {
        if (current === target) return true;

        const transitions: Record<ProductionJobStatus, ProductionJobStatus[]> = {
            [ProductionJobStatus.QUEUED]: [ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.CANCELLED],
            [ProductionJobStatus.IN_PROGRESS]: [ProductionJobStatus.PAUSED, ProductionJobStatus.DONE, ProductionJobStatus.FAILED, ProductionJobStatus.CANCELLED],
            [ProductionJobStatus.PAUSED]: [ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.CANCELLED],
            [ProductionJobStatus.DONE]: [], // Final
            [ProductionJobStatus.FAILED]: [ProductionJobStatus.QUEUED, ProductionJobStatus.CANCELLED],
            [ProductionJobStatus.CANCELLED]: [], // Final
        };

        return transitions[current]?.includes(target) || false;
    }

    private async syncItemStatus(job: ProductionJob): Promise<void> {
        const item = await this.itemRepository.findOne({ 
            where: { id: job.orderItemId },
            select: ['id', 'status', 'orderId']
        });
        if (!item) return;

        const statusMap: Partial<Record<ProductionJobStatus, OrderItemStatus>> = {
            [ProductionJobStatus.QUEUED]: OrderItemStatus.PENDING,
            [ProductionJobStatus.IN_PROGRESS]: OrderItemStatus.IN_PROGRESS,
            [ProductionJobStatus.PAUSED]: OrderItemStatus.IN_PROGRESS,
            [ProductionJobStatus.DONE]: OrderItemStatus.READY,
            [ProductionJobStatus.FAILED]: OrderItemStatus.FAILED,
            [ProductionJobStatus.CANCELLED]: OrderItemStatus.CANCELLED,
        };

        const targetStatus = statusMap[job.status];
        if (targetStatus && item.status !== targetStatus) {
            item.status = targetStatus;
            await this.itemRepository.save(item);
            
            // Gatillo de agregación a nivel Order
            await this.workflowService.aggregateOrderStatus(item.orderId, this.dataSource.manager);
            console.log(`[ProductionSync] Item ${item.id} -> ${targetStatus}. Order ${item.orderId} aggregated.`);
        }
    }

    async assignMaterial(businessId: string, jobId: string, data: { materialId: string, quantity: number }): Promise<ProductionJob> {
        const job = await this.findOne(businessId, jobId);
        const material = await this.materialRepository.findOne({ where: { id: data.materialId, businessId } });
        
        if (!material) throw new NotFoundException('Material no encontrado');

        const jobMat = this.jobMaterialRepository.create({
            jobId,
            materialId: data.materialId,
            quantity: data.quantity,
            isReserved: true
        });

        await this.jobMaterialRepository.save(jobMat);
        return this.findOne(businessId, jobId);
    }

    private async consumeMaterials(job: ProductionJob) {
        if (!job.jobMaterials || job.jobMaterials.length === 0) return;

        await this.dataSource.transaction(async (manager) => {
            for (const jm of job.jobMaterials) {
                if (jm.consumedQuantity >= jm.quantity) continue; // Already consumed

                const material = jm.material;
                const toConsume = jm.quantity - jm.consumedQuantity;

                // Update Material Stock
                material.remainingWeightGrams = Math.max(0, (material.remainingWeightGrams || 0) - toConsume);
                await manager.save(material);

                // Update JobMaterial
                jm.consumedQuantity = jm.quantity;
                await manager.save(jm);
            }
        });
    }
}
