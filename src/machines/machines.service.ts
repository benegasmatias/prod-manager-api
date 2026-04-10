import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { MachineStatus, ProductionJobStatus as JobStatus, OrderStatus } from '../common/enums';
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

    async assignOrder(machineId: string, orderId: string, materialId?: string, businessId?: string, metadata?: any): Promise<Machine> {
        const machine = await this.findOne(machineId, businessId);
        const order = await this.ordersService.findOne(orderId);

        if (!order.items || order.items.length === 0) {
            throw new NotFoundException('El pedido no tiene ítems para producir');
        }

        // Si el pedido ya estaba en otra impresora, liberarla
        if (order.jobs && order.jobs.length > 0) {
            const activeJobs = order.jobs.filter(j =>
                j.machineId &&
                [JobStatus.QUEUED, JobStatus.IN_PROGRESS, JobStatus.PAUSED].includes(j.status as any)
            );

            for (const job of activeJobs) {
                if (job.machineId !== machineId) {
                    // Liberar la otra impresora
                    await this.machineRepository.update(job.machineId, { status: MachineStatus.IDLE });
                    // Cancelar el trabajo anterior
                    await this.jobsService.updateStatus(job.id, JobStatus.CANCELLED, 'Pedido movido a otra impresora');
                } else {
                    // Si es la misma impresora, cancelamos el anterior para que el nuevo tome el control con metadatos frescos
                    await this.jobsService.updateStatus(job.id, JobStatus.CANCELLED, 'Re-asignación en la misma máquina');
                }
            }
        }

        // 1. Marcar impresora como ocupada
        await this.machineRepository.update(machineId, { status: MachineStatus.PRINTING });

        // 2. Marcar pedido como en producción (si no lo estaba)
        if (order.status !== OrderStatus.IN_PROGRESS) {
            await this.ordersService.updateStatus(orderId, { status: OrderStatus.IN_PROGRESS });
        }

        // 3. Crear un trabajo de producción para el primer ítem disponible (simplificación)
        const firstItem = order.items[0];

        await this.jobsService.create({
            orderId: order.id,
            businessId: businessId || order.businessId,
            orderItemId: firstItem.id,
            machineId: machineId,
            materialId: materialId,
            metadata: metadata,
            totalUnits: firstItem.qty
        });

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

    async create(createDto: CreateMachineDto): Promise<Machine> {
        await this.planUsageService.ensureMachineCreationAllowed(createDto.businessId);
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

    async update(id: string, updateDto: UpdateMachineDto, businessId?: string): Promise<Machine> {
        await this.findOne(id, businessId); // Check ownership
        await this.machineRepository.update(id, updateDto);
        return this.findOne(id, businessId);
    }

    async updateStatus(id: string, status: MachineStatus, businessId?: string): Promise<Machine> {
        await this.findOne(id, businessId); // Check ownership
        await this.machineRepository.update(id, { status });
        return this.findOne(id, businessId);
    }

    async deactivate(id: string, businessId?: string): Promise<void> {
        await this.findOne(id, businessId); // Check ownership
        await this.machineRepository.update(id, { active: false });
    }
}
