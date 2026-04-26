import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { MachineStatus, ProductionJobStatus as JobStatus, OrderStatus, OrderItemStatus } from '../common/enums';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { OrdersService } from '../orders/orders.service';
import { JobsService } from '../jobs/jobs.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

import { PlanUsageService } from '../businesses/plan-usage.service';

@Injectable()
export class MachinesService {
    constructor(
        @InjectRepository(Machine)
        private readonly machineRepository: Repository<Machine>,
        private readonly ordersService: OrdersService,
        private readonly jobsService: JobsService,
        private readonly planUsageService: PlanUsageService,
        private readonly auditService: AuditService,
    ) { }

    async assignOrder(machineId: string, orderId: string, orderItemId?: string, materialId?: string, businessId?: string, metadata?: any): Promise<Machine> {
        const machine = await this.findOne(machineId, businessId);
        
        if (machine.blockedByQuota) {
            throw new BadRequestException('Esta unidad de producción está bloqueada por los límites de tu plan actual. Mejora tu plan para usarla.');
        }

        const order = await this.ordersService.findOne(orderId);

        if (!order.items || order.items.length === 0) {
            throw new NotFoundException('El pedido no tiene ítems para producir');
        }

        // Determinar item a producir
        let targetItem: any;

        if (orderItemId) {
            targetItem = order.items.find(i => i.id === orderItemId);
            if (!targetItem) {
                throw new NotFoundException(`El ítem ${orderItemId} no pertenece al pedido ${orderId}`);
            }
        } else {
            // Lógica de selección automática (estricta)
            const eligibleItems = order.items.filter(i => 
                ![OrderItemStatus.DONE, OrderItemStatus.CANCELLED].includes(i.status as any)
            );

            if (eligibleItems.length === 0) {
                throw new BadRequestException('No hay ítems pendientes de producción en este pedido');
            }

            if (eligibleItems.length > 1) {
                throw new BadRequestException('El pedido tiene múltiples ítems pendientes. Debe especificar cuál asignar.');
            }

            targetItem = eligibleItems[0];
        }

        if (targetItem.status === OrderItemStatus.DONE) {
            throw new BadRequestException('El ítem seleccionado ya está completado');
        }

        // Si el ítem ya tenía un trabajo activo en otra impresora, liberarla
        const previousJobs = order.jobs?.filter(j => 
            j.orderItemId === targetItem.id &&
            [JobStatus.QUEUED, JobStatus.IN_PROGRESS, JobStatus.PAUSED].includes(j.status as any)
        );

        if (previousJobs && previousJobs.length > 0) {
            for (const job of previousJobs) {
                if (job.machineId !== machineId) {
                    // Liberar la otra impresora
                    await this.machineRepository.update(job.machineId, { status: MachineStatus.IDLE });
                    // Cancelar el trabajo anterior
                    await this.jobsService.updateStatus(job.id, JobStatus.CANCELLED, 'Re-asignado a otra impresora');
                } else {
                    // Si es la misma impresora, cancelamos el anterior para refrescar metadatos
                    await this.jobsService.updateStatus(job.id, JobStatus.CANCELLED, 'Re-asignación en la misma máquina');
                }
            }
        }

        // 1. Marcar impresora como ocupada
        await this.machineRepository.update(machineId, { status: MachineStatus.PRINTING });

        // 2. Crear o reutilizar trabajo de producción para el item seleccionado
        const existingJob = order.jobs?.find(j => j.orderItemId === targetItem.id);

        const estimatedWeight = metadata?.estimatedGrams || targetItem.weightGrams || 0;

        if (existingJob) {
            await this.jobsService.update(existingJob.id, {
                machineId: machineId,
                materialId: materialId,
                metadata: metadata,
                estimatedMinutes: targetItem.estimatedMinutes,
                estimatedWeightGTotal: estimatedWeight,
                status: JobStatus.QUEUED as any,
                notes: 'Re-asignado desde gestión de piezas'
            });
        } else {
            await this.jobsService.create({
                orderId: order.id,
                businessId: businessId || order.businessId,
                orderItemId: targetItem.id,
                machineId: machineId,
                materialId: materialId,
                metadata: metadata,
                estimatedMinutes: targetItem.estimatedMinutes,
                estimatedWeightGTotal: estimatedWeight,
                totalUnits: targetItem.qty
            });
        }

        // 3. Sincronizar estado del item (esto disparará la agregación del pedido)
        await this.ordersService.syncOrderItemProgress(targetItem.id);

        return this.findOne(machineId, businessId);
    }

    async release(machineId: string, businessId?: string): Promise<Machine> {
        await this.findOne(machineId, businessId); // Check ownership

        // Encontrar trabajos activos para esta impresora y marcarlos como terminados
        const jobs = await this.jobsService.getQueue();
        const printerJobs = jobs.filter(j => j.machineId === machineId);

        for (const job of printerJobs) {
            await this.jobsService.updateStatus(job.id, JobStatus.DONE, 'Liberado mediante gestión de unidades de producción');
        }

        await this.machineRepository.update(machineId, { status: MachineStatus.IDLE });
        return this.findOne(machineId, businessId);
    }

    async create(createDto: CreateMachineDto, context?: { ip?: string, userAgent?: string }): Promise<Machine> {
        await this.planUsageService.ensureMachineCreationAllowed(createDto.businessId, context);
        const machine = this.machineRepository.create(createDto);
        const saved = await this.machineRepository.save(machine);
        
        await this.auditService.log(
            AuditAction.RESOURCE_CREATED,
            'MACHINE',
            saved.id,
            saved.businessId,
            null,
            { name: saved.name, model: saved.model }
        );

        return saved;
    }

    async findAll(businessId?: string, onlyActive: boolean = true, page: number = 1, pageSize: number = 50): Promise<{ data: Machine[], total: number }> {
        const where: any = {};
        if (businessId) where.businessId = businessId;
        if (onlyActive) where.active = true;

        const [data, total] = await this.machineRepository.findAndCount({
            where,
            order: { name: 'ASC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        });
        
        return { data, total };
    }

    async findOne(id: string, businessId?: string): Promise<Machine> {
        const where: any = { id };
        if (businessId) where.businessId = businessId;

        const machine = await this.machineRepository.findOne({
            where,
            relations: ['productionJobs', 'productionJobs.order', 'productionJobs.orderItem', 'productionJobs.orderItem.product'],
            order: {
                productionJobs: {
                    createdAt: 'DESC'
                }
            }
        });
        if (!machine) {
            throw new NotFoundException(`Unidad de producción con ID ${id} no encontrada`);
        }
        return machine;
    }

    async update(id: string, updateDto: UpdateMachineDto, businessId?: string, context?: { ip?: string, userAgent?: string }): Promise<Machine> {
        const machine = await this.findOne(id, businessId); // Check ownership
        
        // Si se está reactivando, validar límites del plan
        if (updateDto.active === true && machine.active === false) {
            await this.planUsageService.ensureMachineCreationAllowed(machine.businessId, context);
        }

        await this.machineRepository.update(id, updateDto);
        await this.planUsageService.reconcileQuota(machine.businessId);
        return this.findOne(id, businessId);
    }

    async updateStatus(id: string, status: MachineStatus, businessId?: string): Promise<Machine> {
        await this.findOne(id, businessId); // Check ownership
        await this.machineRepository.update(id, { status });
        await this.planUsageService.reconcileQuota(businessId);
        return this.findOne(id, businessId);
    }

    async deactivate(id: string, businessId?: string): Promise<void> {
        const machine = await this.findOne(id, businessId); // Check ownership
        await this.machineRepository.update(id, { active: false });
        await this.planUsageService.reconcileQuota(machine.businessId);
    }
}
