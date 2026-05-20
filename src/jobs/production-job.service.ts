import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';
import { OrderWorkflowService } from '../orders/order-workflow.service';
import { ProductionJobStatus, ProductionJobPriority, OrderStatus, OrderItemStatus, MachineStatus } from '../common/enums';
import { ProductionJobMaterial } from './entities/production-job-material.entity';
import { Material } from '../materials/entities/material.entity';
import { Machine } from '../machines/entities/machine.entity';
import { MaterialMovement } from '../materials/entities/material-movement.entity';
import { EntityManager } from 'typeorm';

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
            relations: ['productionJobs', 'order']
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

    private async validateMachineAvailability(machineId: string, jobId: string, jobStatus: ProductionJobStatus) {
        const machine = await this.machineRepository.findOne({ where: { id: machineId } });
        if (!machine) {
            throw new NotFoundException('La máquina especificada no existe.');
        }
        if (!machine.active) {
            throw new BadRequestException(`La máquina "${machine.name}" no está activa.`);
        }
        if (machine.status === MachineStatus.MAINTENANCE || machine.status === MachineStatus.DOWN) {
            throw new BadRequestException(`La máquina "${machine.name}" está en mantenimiento o fuera de servicio.`);
        }

        if (jobStatus === ProductionJobStatus.IN_PROGRESS) {
            const activeJobOnMachine = await this.jobRepository.findOne({
                where: {
                    machineId,
                    status: ProductionJobStatus.IN_PROGRESS
                }
            });

            if (activeJobOnMachine && activeJobOnMachine.id !== jobId) {
                throw new BadRequestException(`La máquina ${machine.name} ya está ocupada por otro trabajo en proceso.`);
            }
        }
    }

    async assignResources(businessId: string, id: string, data: { operatorId?: string, machineId?: string }): Promise<ProductionJob> {
        const job = await this.jobRepository.findOne({
            where: { id, businessId },
            select: ['id', 'machineId', 'status', 'orderItemId']
        });
        if (!job) throw new NotFoundException('Trabajo de producción no encontrado');

        const oldMachineId = job.machineId;
        
        if (data.operatorId !== undefined) job.operatorId = data.operatorId;
        
        if (data.machineId !== undefined) {
            if (data.machineId) {
                await this.validateMachineAvailability(data.machineId, job.id, job.status);
            }
            job.machineId = data.machineId;
        }

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
        // Load full entity to ensure all fields like totalUnits, businessId, materialId are loaded
        const job = await this.jobRepository.findOne({
            where: { id, businessId }
        });
        
        if (!job) throw new NotFoundException('Trabajo de producción no encontrado');

        if (job.status === status) {
            return this.findOne(businessId, id);
        }

        if (!this.canTransitionStatus(job.status, status)) {
            throw new BadRequestException(`Transición de estado inválida: de ${job.status} a ${status}`);
        }

        if (status === ProductionJobStatus.IN_PROGRESS) {
            if (!job.machineId) {
                throw new BadRequestException('No se puede iniciar el trabajo sin una máquina asignada.');
            }
            await this.validateMachineAvailability(job.machineId, job.id, status);
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
        }

        if (status === ProductionJobStatus.DONE || status === ProductionJobStatus.FAILED || status === ProductionJobStatus.CANCELLED) {
            if (status === ProductionJobStatus.DONE) job.completedAt = now;
        }

        let saved: ProductionJob;

        await this.dataSource.transaction(async (manager) => {
            if (status === ProductionJobStatus.IN_PROGRESS) {
                if (job.machineId) {
                    await manager.update(Machine, job.machineId, { status: MachineStatus.PRINTING });
                }
            }

            if (status === ProductionJobStatus.DONE || status === ProductionJobStatus.FAILED || status === ProductionJobStatus.CANCELLED) {
                if (job.machineId) {
                    await manager.update(Machine, job.machineId, { status: MachineStatus.IDLE });
                }

                if (status === ProductionJobStatus.DONE) {
                    // Control de filamento / material
                    // Solo descontamos lo que falte por reportar como avance
                    const progress = await manager.find('JobProgress', { where: { productionJobId: job.id } }) as any[];
                    const unitsReported = progress?.reduce((sum, p) => sum + p.unitsDone, 0) || 0;
                    const unitsPending = Math.max(0, job.totalUnits - unitsReported);

                    if (unitsPending > 0) {
                        await this.deductMaterialWeightTx(manager, job, unitsPending);
                    }
                }
            }

            saved = await manager.save(job);

            // Sync with OrderItem/Order within transaction
            await this.syncItemStatusTx(manager, saved);
        });

        return this.findOne(businessId, id);
    }

    async updateStage(businessId: string, id: string, stage: string): Promise<ProductionJob> {
        const job = await this.findOne(businessId, id);
        
        // Validation against Business Template Stages
        const business = await this.businessRepository.findOneBy({ id: businessId });
        const template = await this.templateRepository.findOneBy({ key: business.category });
        
        if (!template) {
            throw new ForbiddenException(`El negocio no tiene un rubro (template) configurado para fabricación.`);
        }

        // Etapas de orden comercial/visita — no aplican a un trabajo de producción
        const PRE_PRODUCTION_STAGES = [
            'QUOTATION', 'BUDGET_GENERATED', 'BUDGET_REJECTED',
            'SITE_VISIT', 'SITE_VISIT_DONE', 'VISITA_REPROGRAMADA', 'VISITA_CANCELADA',
            'APPROVED', 'DRAFT', 'SURVEY_DESIGN',
        ];

        // Soporta tanto arrays de strings como arrays de objetos { key, label, color }
        const rawStages = template.config?.productionStages || template.config?.stages || [];
        const allowedStages: string[] = rawStages
            .map((s: any) => (typeof s === 'string' ? s : s?.key))
            .filter((key: string) => key && !PRE_PRODUCTION_STAGES.includes(key));

        if (allowedStages.length === 0) {
            throw new BadRequestException(`El rubro "${business.category}" no tiene etapas de producción definidas.`);
        }

        if (!allowedStages.includes(stage)) {
            throw new BadRequestException(`La etapa "${stage}" no es válida para el rubro "${business.category}". Etapas permitidas: ${allowedStages.join(', ')}`);
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

    private async syncItemStatusTx(manager: EntityManager, job: ProductionJob): Promise<void> {
        const item = await manager.findOne(OrderItem, { 
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
            await manager.save(item);
            
            // Gatillo de agregación a nivel Order
            await this.workflowService.aggregateOrderStatus(item.orderId, manager);
            console.log(`[ProductionSync] Item ${item.id} -> ${targetStatus}. Order ${item.orderId} aggregated.`);
        }
    }

    private async deductMaterialWeightTx(manager: EntityManager, job: ProductionJob, units: number, userId?: string) {
        // 1. Validation check for IMPRESION_3D
        let jobMaterials = job.jobMaterials;
        if (!jobMaterials || jobMaterials.length === 0) {
            jobMaterials = await manager.find(ProductionJobMaterial, {
                where: { jobId: job.id },
                relations: ['material']
            });
        }

        const business = await manager.findOne(Business, { where: { id: job.businessId } });
        if (business && business.category === 'IMPRESION_3D') {
            const hasMaterial = job.materialId || 
                                (job.metadata?.materials && Array.isArray(job.metadata.materials) && job.metadata.materials.length > 0) ||
                                (jobMaterials && jobMaterials.length > 0);
            if (!hasMaterial) {
                throw new BadRequestException('No se puede finalizar el trabajo de Impresión 3D sin un material/filamento asignado.');
            }
        }

        if (units <= 0) return;

        const createdBy = userId || 'SYSTEM';

        // Support for jobMaterials
        if (jobMaterials && jobMaterials.length > 0) {
            for (const jm of jobMaterials) {
                const quantityPerUnit = jm.quantity / (job.totalUnits || 1);
                let toConsume = quantityPerUnit * units;

                const remainingToConsume = Math.max(0, jm.quantity - jm.consumedQuantity);
                toConsume = Math.min(toConsume, remainingToConsume);

                if (toConsume > 0) {
                    const material = jm.material || await manager.findOne(Material, { where: { id: jm.materialId } });
                    if (material) {
                        const oldStock = material.remainingWeightGrams || 0;
                        const newStock = Math.max(0, oldStock - toConsume);

                        material.remainingWeightGrams = newStock;
                        await manager.save(material);

                        jm.consumedQuantity = (jm.consumedQuantity || 0) + toConsume;
                        await manager.save(jm);

                        const movement = manager.create(MaterialMovement, {
                            businessId: job.businessId || material.businessId,
                            materialId: material.id,
                            type: 'OUT',
                            quantity: toConsume,
                            oldValue: oldStock,
                            newValue: newStock,
                            unit: material.unit || 'grams',
                            referenceType: 'PRODUCTION_CONSUMPTION',
                            referenceId: job.id,
                            notes: `Consumo producción - Trabajo: ${job.id}, Item: ${job.orderItemId}, Orden: ${job.orderId}`,
                            createdBy
                        });
                        await manager.save(movement);
                        console.log(`[Filamento Tx - JobMat] Descontados ${toConsume.toFixed(2)}g de ${material.name}. Restante: ${newStock.toFixed(2)}g`);
                    }
                }
            }
            return;
        }

        // Support for metadata.materials
        if (job.metadata?.materials && Array.isArray(job.metadata.materials)) {
            for (const matSpec of job.metadata.materials) {
                const { materialId, gramsPerUnit } = matSpec;
                if (!materialId || !gramsPerUnit) continue;

                const toConsume = gramsPerUnit * units;
                if (toConsume > 0) {
                    const material = await manager.findOne(Material, { where: { id: materialId } });
                    if (material) {
                        const oldStock = material.remainingWeightGrams || 0;
                        const newStock = Math.max(0, oldStock - toConsume);

                        material.remainingWeightGrams = newStock;
                        await manager.save(material);

                        const movement = manager.create(MaterialMovement, {
                            businessId: job.businessId || material.businessId,
                            materialId: material.id,
                            type: 'OUT',
                            quantity: toConsume,
                            oldValue: oldStock,
                            newValue: newStock,
                            unit: material.unit || 'grams',
                            referenceType: 'PRODUCTION_CONSUMPTION',
                            referenceId: job.id,
                            notes: `Consumo producción - Trabajo: ${job.id}, Item: ${job.orderItemId}, Orden: ${job.orderId}`,
                            createdBy
                        });
                        await manager.save(movement);
                        console.log(`[Filamento Tx - Metadata] Descontados ${toConsume.toFixed(2)}g de ${material.name}. Restante: ${newStock.toFixed(2)}g`);
                    }
                }
            }
            return;
        }

        // Support for job.materialId
        if (job.materialId) {
            let weightPerUnit = 0;
            if (job.estimatedWeightGTotal) {
                weightPerUnit = job.estimatedWeightGTotal / (job.totalUnits || 1);
            } else if (job.orderItem?.weightGrams) {
                weightPerUnit = job.orderItem.weightGrams;
            }

            const toConsume = weightPerUnit * units;
            if (toConsume > 0) {
                const material = await manager.findOne(Material, { where: { id: job.materialId } });
                if (material) {
                    const oldStock = material.remainingWeightGrams || 0;
                    const newStock = Math.max(0, oldStock - toConsume);

                    material.remainingWeightGrams = newStock;
                    await manager.save(material);

                    const movement = manager.create(MaterialMovement, {
                        businessId: job.businessId || material.businessId,
                        materialId: material.id,
                        type: 'OUT',
                        quantity: toConsume,
                        oldValue: oldStock,
                        newValue: newStock,
                        unit: material.unit || 'grams',
                        referenceType: 'PRODUCTION_CONSUMPTION',
                        referenceId: job.id,
                        notes: `Consumo producción - Trabajo: ${job.id}, Item: ${job.orderItemId}, Orden: ${job.orderId}`,
                        createdBy
                    });
                    await manager.save(movement);
                    console.log(`[Filamento Tx - Single] Descontados ${toConsume.toFixed(2)}g de ${material.name}. Restante: ${newStock.toFixed(2)}g`);
                }
            }
        }
    }
}
