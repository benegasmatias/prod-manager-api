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
        const parentOrder = await this.ordersService.findOne(createJobDto.orderId);
        if (!parentOrder) throw new NotFoundException('Pedido no encontrado');

        const initialStatus = createJobDto.machineId ? JobStatus.IN_PROGRESS : JobStatus.QUEUED;

        const job = this.jobRepository.create({
            ...(createJobDto as any),
            businessId: createJobDto.businessId ?? parentOrder.businessId,
            status: initialStatus as any,
        });

        const saved = await this.jobRepository.save(job);
        const savedJob = Array.isArray(saved) ? saved[0] : saved;

        // Discount material immediately if starting
        if (initialStatus === JobStatus.IN_PROGRESS) {
            const fullJobForDeduction = await this.findOne(savedJob.id);
            await this.deductMaterialWeight(fullJobForDeduction, fullJobForDeduction.totalUnits);
        }

        const history = this.statusHistoryRepository.create({
            productionJobId: savedJob.id,
            toStatus: initialStatus as any,
            note: createJobDto.machineId ? 'Started on machine' : 'Initial queuing',
            performedById: userId
        });
        await this.statusHistoryRepository.save(history);

        const fullJob = await this.findOne(savedJob.id);
        const order = fullJob.order;

        // Automatically transition order to IN_PROGRESS if it was CONFIRMED or DRAFT
        if (order.status === OrderStatus.DRAFT || order.status === OrderStatus.CONFIRMED) {
            await this.ordersService.updateStatus(order.id, { status: OrderStatus.IN_PROGRESS, notes: 'Production jobs started.' }, userId);
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
            relations: ['order', 'orderItem', 'orderItem.product', 'machine', 'material', 'progress', 'operator'],
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
                'operator',
            ],
        });
        if (!job) throw new NotFoundException('Trabajo no encontrado');
        return job;
    }

    async updateStatus(id: string, status: JobStatus, note?: string, userId?: string) {
        const job = await this.findOne(id);
        const oldStatus = job.status;

        await this.jobRepository.update(id, { status: status as any });

        const history = this.statusHistoryRepository.create({
            productionJobId: id,
            fromStatus: oldStatus as any,
            toStatus: status as any,
            note,
            performedById: userId
        });
        await this.statusHistoryRepository.save(history);

        if (status === JobStatus.DONE) {
            // Si el trabajo tenía una impresora asignada, la liberamos
            if (job.machineId) {
                await this.machineRepository.update(job.machineId, { status: MachineStatus.IDLE });
            }

            // --- Control de Filamento / Material ---
            // Solo descontamos lo que falte por reportar como avance
            const unitsReported = job.progress?.reduce((sum, p) => sum + p.unitsDone, 0) || 0;
            const unitsPending = Math.max(0, job.totalUnits - unitsReported);

            if (unitsPending > 0) {
                await this.deductMaterialWeight(job, unitsPending);
            }

            await this.ordersService.syncOrderItemProgress(job.orderItemId);
            await this.ordersService.checkAndSetReadyStatus(job.orderId);
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

        const progress = this.progressRepository.create({
            productionJobId: id,
            ...createProgressDto,
            performedById: userId
        });
        await this.progressRepository.save(progress);

        // Descontar material por el avance reportado
        await this.deductMaterialWeight(job, createProgressDto.unitsDone);

        const updatedUnitsDone = currentUnitsDone + createProgressDto.unitsDone;

        if (job.orderItemId) {
            await this.ordersService.syncOrderItemProgress(job.orderItemId);
        }

        if (updatedUnitsDone === job.totalUnits) {
            await this.updateStatus(id, JobStatus.DONE, 'Completion reported via progress update.');
        }

        return this.findOne(id);
    }
    /**
     * Helper para descontar material del stock basado en las unidades producidas.
     */
    private async deductMaterialWeight(job: ProductionJob, units: number) {
        if (units <= 0) return;

        // Soporte para múltiples materiales (ej: Bambu A1 Combo)
        if (job.metadata?.materials && Array.isArray(job.metadata.materials)) {
            for (const matSpec of job.metadata.materials) {
                const { materialId, gramsPerUnit } = matSpec;
                if (!materialId || !gramsPerUnit) continue;

                const weightToDeduct = gramsPerUnit * units;
                if (weightToDeduct > 0) {
                    const material = await this.materialRepository.findOneBy({ id: materialId });
                    if (material) {
                        const newRemaining = Math.max(0, material.remainingWeightGrams - weightToDeduct);
                        await this.materialRepository.update(material.id, { remainingWeightGrams: newRemaining });
                        console.log(`[Filamento Multi] Descontados ${weightToDeduct.toFixed(2)}g de ${material.name}. Restante: ${newRemaining.toFixed(2)}g`);
                    }
                }
            }
            return; // Evitar doble descuento si hay un material primario seteado
        }

        if (!job.materialId) return;

        // Peso estimado por unidad
        let weightPerUnit = 0;
        if (job.estimatedWeightGTotal) {
            weightPerUnit = job.estimatedWeightGTotal / job.totalUnits;
        } else if (job.orderItem?.weightGrams) {
            weightPerUnit = job.orderItem.weightGrams;
        }

        const weightToDeduct = weightPerUnit * units;

        if (weightToDeduct > 0) {
            const material = await this.materialRepository.findOneBy({ id: job.materialId });
            if (material) {
                const newRemaining = Math.max(0, material.remainingWeightGrams - weightToDeduct);
                await this.materialRepository.update(material.id, { remainingWeightGrams: newRemaining });
                console.log(`[Filamento] Descontados ${weightToDeduct.toFixed(2)}g del material ${material.name}. Restante: ${newRemaining.toFixed(2)}g`);
            }
        }
    }
}
