import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { PrinterStatus, JobStatus, OrderStatus } from '../common/enums';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { OrdersService } from '../orders/orders.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class PrintersService {
    constructor(
        @InjectRepository(Printer)
        private readonly printerRepository: Repository<Printer>,
        private readonly ordersService: OrdersService,
        private readonly jobsService: JobsService,
    ) { }

    async assignOrder(printerId: string, orderId: string, materialId?: string, businessId?: string, metadata?: any): Promise<Printer> {
        const printer = await this.findOne(printerId, businessId);
        const order = await this.ordersService.findOne(orderId);

        if (!order.items || order.items.length === 0) {
            throw new NotFoundException('El pedido no tiene ítems para producir');
        }

        // Si el pedido ya estaba en otra impresora, liberarla
        if (order.jobs && order.jobs.length > 0) {
            const activeJobs = order.jobs.filter(j =>
                j.printerId &&
                [JobStatus.QUEUED, JobStatus.PRINTING, JobStatus.PAUSED].includes(j.status)
            );

            for (const job of activeJobs) {
                if (job.printerId !== printerId) {
                    // Liberar la otra impresora
                    await this.printerRepository.update(job.printerId, { status: PrinterStatus.IDLE });
                    // Cancelar el trabajo anterior
                    await this.jobsService.updateStatus(job.id, JobStatus.CANCELLED, 'Pedido movido a otra impresora');
                } else {
                    // Si es la misma impresora, cancelamos el anterior para que el nuevo tome el control con metadatos frescos
                    await this.jobsService.updateStatus(job.id, JobStatus.CANCELLED, 'Re-asignación en la misma máquina');
                }
            }
        }

        // 1. Marcar impresora como ocupada
        await this.printerRepository.update(printerId, { status: PrinterStatus.PRINTING });

        // 2. Marcar pedido como en producción (si no lo estaba)
        if (order.status !== OrderStatus.IN_PROGRESS) {
            await this.ordersService.updateStatus(orderId, { status: OrderStatus.IN_PROGRESS });
        }

        // 3. Crear un trabajo de producción para el primer ítem disponible (simplificación)
        const firstItem = order.items[0];

        await this.jobsService.create({
            orderId: order.id,
            orderItemId: firstItem.id,
            printerId: printerId,
            materialId: materialId,
            metadata: metadata,
            totalUnits: firstItem.qty,
            title: `Prod: ${order.code || 'S/N'} - ${firstItem.name}`
        });

        return this.findOne(printerId, businessId);
    }

    async release(printerId: string, businessId?: string): Promise<Printer> {
        await this.findOne(printerId, businessId); // Check ownership

        // Encontrar trabajos activos para esta impresora y marcarlos como terminados
        const jobs = await this.jobsService.getQueue();
        const printerJobs = jobs.filter(j => j.printerId === printerId);

        for (const job of printerJobs) {
            await this.jobsService.updateStatus(job.id, JobStatus.DONE, 'Liberado mediante gestión de unidades de producción');
        }

        await this.printerRepository.update(printerId, { status: PrinterStatus.IDLE });
        return this.findOne(printerId, businessId);
    }

    async create(createDto: CreatePrinterDto): Promise<Printer> {
        const printer = this.printerRepository.create(createDto);
        return this.printerRepository.save(printer);
    }

    async findAll(businessId?: string, onlyActive: boolean = true): Promise<Printer[]> {
        const where: any = {};
        if (businessId) where.businessId = businessId;
        if (onlyActive) where.active = true;

        return this.printerRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string, businessId?: string): Promise<Printer> {
        const where: any = { id };
        if (businessId) where.businessId = businessId;

        const printer = await this.printerRepository.findOne({
            where,
            relations: ['productionJobs', 'productionJobs.order', 'productionJobs.orderItem', 'productionJobs.orderItem.product'],
            order: {
                productionJobs: {
                    createdAt: 'DESC'
                }
            }
        });
        if (!printer) {
            throw new NotFoundException(`Unidad de producción con ID ${id} no encontrada`);
        }
        return printer;
    }

    async update(id: string, updateDto: UpdatePrinterDto, businessId?: string): Promise<Printer> {
        await this.findOne(id, businessId); // Check ownership
        await this.printerRepository.update(id, updateDto);
        return this.findOne(id, businessId);
    }

    async updateStatus(id: string, status: PrinterStatus, businessId?: string): Promise<Printer> {
        await this.findOne(id, businessId); // Check ownership
        await this.printerRepository.update(id, { status });
        return this.findOne(id, businessId);
    }

    async deactivate(id: string, businessId?: string): Promise<void> {
        await this.findOne(id, businessId); // Check ownership
        await this.printerRepository.update(id, { active: false });
    }
}
