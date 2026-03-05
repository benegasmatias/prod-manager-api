import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { PrinterStatus, JobStatus, OrderStatus } from '../common/enums';
import { CreatePrinterDto } from './dto/create-printer.dto';
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

    async assignOrder(printerId: string, orderId: string): Promise<Printer> {
        const printer = await this.findOne(printerId);
        const order = await this.ordersService.findOne(orderId);

        if (!order.items || order.items.length === 0) {
            throw new NotFoundException('El pedido no tiene ítems para producir');
        }

        // 1. Marcar impresora como ocupada
        await this.printerRepository.update(printerId, { status: PrinterStatus.PRINTING });

        // 2. Marcar pedido como en producción (si no lo estaba)
        if (order.status !== OrderStatus.IN_PROGRESS) {
            await this.ordersService.updateStatus(orderId, { status: OrderStatus.IN_PROGRESS });
        }

        // 3. Crear un trabajo de producción para el primer ítem disponible (simplificación)
        // Buscamos si ya existe un job para este primer ítem, sino lo creamos
        const firstItem = order.items[0];

        // Usamos jobsService.create si queremos seguir el flujo estándar
        await this.jobsService.create({
            orderId: order.id,
            orderItemId: firstItem.id,
            printerId: printerId,
            totalUnits: firstItem.qty,
            title: `Prod: ${order.code || 'S/N'} - ${firstItem.name}`
        });

        return this.findOne(printerId);
    }

    async release(printerId: string): Promise<Printer> {
        // Encontrar trabajos activos para esta impresora y marcarlos como terminados
        const jobs = await this.jobsService.getQueue();
        const printerJobs = jobs.filter(j => j.printerId === printerId);

        for (const job of printerJobs) {
            await this.jobsService.updateStatus(job.id, JobStatus.DONE, 'Liberado mediante gestión de máquinas');
        }

        await this.printerRepository.update(printerId, { status: PrinterStatus.IDLE });
        return this.findOne(printerId);
    }

    async create(createPrinterDto: CreatePrinterDto): Promise<Printer> {
        const printer = this.printerRepository.create(createPrinterDto);
        return this.printerRepository.save(printer);
    }

    async findAll(businessId?: string): Promise<Printer[]> {
        const where = businessId ? { businessId } : {};
        return this.printerRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Printer> {
        const printer = await this.printerRepository.findOne({
            where: { id },
            relations: ['productionJobs', 'productionJobs.order', 'productionJobs.orderItem', 'productionJobs.orderItem.product'],
            order: {
                productionJobs: {
                    createdAt: 'DESC'
                }
            }
        });
        if (!printer) {
            throw new NotFoundException(`Impresora con ID ${id} no encontrada`);
        }
        return printer;
    }

    async updateStatus(id: string, status: PrinterStatus): Promise<Printer> {
        await this.printerRepository.update(id, { status });
        return this.findOne(id);
    }
}
