import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductionJob } from './entities/production-job.entity';
import { JobProgress } from './entities/job-progress.entity';
import { JobStatusHistory } from '../history/entities/job-status-history.entity';
import { OrdersService } from '../orders/orders.service';
import { CreateJobDto, CreateProgressDto, UpdateJobDto } from './dto/job.dto';
import { ProductionJobStatus as JobStatus, OrderStatus, MachineStatus } from '../common/enums';
import { Machine } from '../machines/entities/machine.entity';
import { Material } from '../materials/entities/material.entity';
import { MaterialMovement } from '../materials/entities/material-movement.entity';
import { ProductionJobMaterial } from './entities/production-job-material.entity';
import { Business } from '../businesses/entities/business.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class JobsService {
    constructor(
        @InjectRepository(ProductionJob)
        private readonly jobRepository: Repository<ProductionJob>,
        @InjectRepository(JobProgress)
        private readonly progressRepository: Repository<JobProgress>,
        @InjectRepository(JobStatusHistory)
        private readonly statusHistoryRepository: Repository<JobStatusHistory>,
        @InjectRepository(Machine)
        private readonly machineRepository: Repository<Machine>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        private readonly ordersService: OrdersService,
    ) { }

    async create(createJobDto: CreateJobDto, userId?: string) {
        // Concurrency Guard & Race Condition Protection
        if (createJobDto.orderItemId) {
            const existingJobs = await this.jobRepository.find({
                where: { orderItemId: createJobDto.orderItemId }
            });

            const orderItem = await this.ordersService.findOrderItem(createJobDto.orderItemId);
            if (orderItem) {
                const isMultiPart = orderItem.metadata?.parts && Array.isArray(orderItem.metadata.parts);
                const partId = createJobDto.metadata?.partId;

                if (isMultiPart && partId) {
                    const part = orderItem.metadata.parts.find((p: any) => p.id === partId);
                    if (part) {
                        const qtyPerUnit = part.qtyPerUnit || 1;
                        const partLimit = orderItem.qty * qtyPerUnit;
                        const totalAssignedForPart = existingJobs
                            .filter(j => j.metadata?.partId === partId)
                            .reduce((sum, j) => sum + j.totalUnits, 0);

                        if (totalAssignedForPart + createJobDto.totalUnits > partLimit) {
                            console.warn(`[CONCURRENCY GUARD] Intento de asignación excedida para la parte ${partId}: ${totalAssignedForPart} + ${createJobDto.totalUnits} > ${partLimit}`);
                            throw new BadRequestException(`No se puede crear la tanda. La cantidad acumulada asignada para la parte '${part.name}' (${totalAssignedForPart + createJobDto.totalUnits}) excedería la cantidad requerida (${partLimit}).`);
                        }
                    }
                } else {
                    const totalAssigned = existingJobs.reduce((sum, j) => sum + j.totalUnits, 0);
                    const limit = orderItem.qty;
                    if (totalAssigned + createJobDto.totalUnits > limit) {
                        console.warn(`[CONCURRENCY GUARD] [RACE CONDITION PREVENTED] Intento de asignación excedida: ${totalAssigned} + ${createJobDto.totalUnits} > ${limit}`);
                        throw new BadRequestException(`No se puede crear la tanda. La cantidad acumulada asignada (${totalAssigned + createJobDto.totalUnits}) excedería la cantidad requerida en el pedido (${limit}).`);
                    }
                }
            }
        }

        const job = this.jobRepository.create({
            orderId: createJobDto.orderId,
            businessId: createJobDto.businessId,
            orderItemId: createJobDto.orderItemId,
            machineId: createJobDto.machineId,
            materialId: createJobDto.materialId,
            totalUnits: createJobDto.totalUnits,
            priority: createJobDto.priority as any,
            operatorId: createJobDto.operatorId,
            metadata: createJobDto.metadata,
            estimatedMinutes: createJobDto.estimatedMinutes,
            estimatedWeightGTotal: createJobDto.estimatedWeightGTotal,
            status: JobStatus.QUEUED as any,
        });

        console.log(`[JOBS_SERVICE] [CREATE] Creando tanda de producción paralela. Item ID: ${createJobDto.orderItemId}, Máquina: ${createJobDto.machineId}, Unidades: ${createJobDto.totalUnits}`);

        const saved = await this.jobRepository.save(job);
        const savedJob = Array.isArray(saved) ? saved[0] : saved;

        const history = this.statusHistoryRepository.create({
            productionJobId: savedJob.id,
            toStatus: JobStatus.QUEUED as any, // Cast for enum alignment
            note: 'Initial queuing',
            performedById: userId
        });
        await this.statusHistoryRepository.save(history);

        const fullJob = await this.findOne(savedJob.id);
        const order = fullJob.order;

        // Al crear un trabajo, sincronizamos el item (esto disparará la agregación del pedido)
        if (savedJob.orderItemId) {
            await this.ordersService.syncOrderItemProgress(savedJob.orderItemId);
        }

        return fullJob;
    }

    async getQueue(businessId?: string) {
        const where: any = {
            status: In([JobStatus.QUEUED, JobStatus.IN_PROGRESS, JobStatus.PAUSED]),
        };

        if (businessId) {
            where.order = { businessId };
        }

        return this.jobRepository.find({
            where,
            relations: ['order', 'orderItem', 'orderItem.product', 'machine', 'material', 'progress'],
            order: {
                createdAt: 'DESC'
            },
        });
    }

    async findOne(id: string) {
        const job = await this.jobRepository.findOne({
            where: { id },
            relations: [
                'order',
                'orderItem',
                'orderItem.product',
                'progress',
                'statusHistory',
                'material',
            ],
        });
        if (!job) throw new NotFoundException('Trabajo no encontrado');
        return job;
    }

    async updateStatus(id: string, status: JobStatus, note?: string, userId?: string) {
        const job = await this.findOne(id);
        const oldStatus = job.status;

        if (job.status === status) {
            return this.findOne(id);
        }

        console.log(`[JOBS_SERVICE] [STATUS_UPDATE] Tanda ${id} cambió de ${oldStatus} a ${status}. Motivo/Nota: ${note || 'Sin detalles'}`);

        await this.jobRepository.manager.transaction(async (manager) => {
            await manager.update(ProductionJob, id, { status: status as any });

            const history = manager.create(JobStatusHistory, {
                productionJobId: id,
                fromStatus: oldStatus as any,
                toStatus: status as any,
                note,
                performedById: userId
            });
            await manager.save(history);

            if (status === JobStatus.DONE) {
                if (job.machineId) {
                    await manager.update(Machine, job.machineId, { status: MachineStatus.IDLE });
                }

                // --- Control de Filamento / Material ---
                // Solo descontamos lo que falte por reportar como avance
                const progress = await manager.find(JobProgress, { where: { productionJobId: id } });
                const unitsReported = progress?.reduce((sum, p) => sum + p.unitsDone, 0) || 0;
                const unitsPending = Math.max(0, job.totalUnits - unitsReported);

                if (unitsPending > 0) {
                    await this.deductMaterialWeightTx(manager, job, unitsPending, userId);
                }

                await manager.update(ProductionJob, id, { doneQty: job.totalUnits });
            }
        });

        // Sincronizar estado del item y agregar estado del pedido
        if (job.orderItemId) {
            await this.ordersService.syncOrderItemProgress(job.orderItemId);
        }

        return this.findOne(id);
    }

    async update(id: string, updateJobDto: UpdateJobDto, userId?: string) {
        const { status, notes, ...data } = updateJobDto;

        if (status) {
            return this.updateStatus(id, status as any, notes, userId);
        }

        if (Object.keys(data).length > 0 || notes) {
            await this.jobRepository.update(id, { ...data, notes } as any);
        }

        return this.findOne(id);
    }

    async addProgress(id: string, createProgressDto: CreateProgressDto, userId?: string) {
        const job = await this.findOne(id);

        // Total units done so far
        const currentUnitsDone = job.progress.reduce((sum, p) => sum + p.unitsDone, 0);

        if (currentUnitsDone + createProgressDto.unitsDone > job.totalUnits) {
            throw new BadRequestException('El total de unidades completadas no puede exceder los requerimientos del trabajo');
        }

        console.log(`[JOBS_SERVICE] [PROGRESS] Reportando avance en Tanda ${id}: +${createProgressDto.unitsDone} unidades de ${job.totalUnits}. Unidades descartadas/scrap: ${createProgressDto.unitsFailed || 0}`);

        await this.jobRepository.manager.transaction(async (manager) => {
            const progress = manager.create(JobProgress, {
                productionJobId: id,
                unitsDone: createProgressDto.unitsDone,
                note: createProgressDto.note,
                performedById: userId
            });
            await manager.save(progress);

            // Descontar material por el avance reportado
            await this.deductMaterialWeightTx(manager, job, createProgressDto.unitsDone, userId);

            const updatedUnitsDone = currentUnitsDone + createProgressDto.unitsDone;

            job.doneQty = updatedUnitsDone;
            if (createProgressDto.unitsFailed) {
                job.failedQty = (job.failedQty || 0) + createProgressDto.unitsFailed;
            }
            await manager.save(job);
        });

        const updatedUnitsDone = currentUnitsDone + createProgressDto.unitsDone;

        if (updatedUnitsDone === job.totalUnits) {
            await this.updateStatus(id, JobStatus.DONE, 'Completion reported via progress update.', userId);
        } else {
            if (job.orderItemId) {
                await this.ordersService.syncOrderItemProgress(job.orderItemId);
            }
        }

        return this.findOne(id);
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
