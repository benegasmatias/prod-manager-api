import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus, JobStatus, PrinterStatus } from '../common/enums';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Printer } from '../printers/entities/printer.entity';
import { CreateOrderDto, UpdateProgressDto, UpdateOrderStatusDto, FindOrdersDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(ProductionJob)
        private readonly jobRepository: Repository<ProductionJob>,
        @InjectRepository(Printer)
        private readonly printerRepository: Repository<Printer>,
    ) { }

    /**
     * Obtener pedidos ordenados por dueDate asc, luego priority desc (asumiendo que mayor nro es más prioridad)
     */
    async findAll(query: FindOrdersDto): Promise<Order[]> {
        const { businessId, status } = query;
        const where: any = {};
        if (businessId) where.businessId = businessId;
        if (status) where.status = status;

        return this.orderRepository.find({
            where,
            relations: ['items'],
            order: {
                dueDate: 'ASC',
                priority: 'DESC',
            },
        });
    }

    /**
     * Obtener un pedido por ID con sus ítems
     */
    async findOne(id: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['items'],
        });

        if (!order) {
            throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
        }
        return order;
    }

    /**
     * Crear pedido completo con sus ítems
     */
    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        const { items, ...orderData } = createOrderDto;

        // Generar un código único simple si no viene uno
        const code = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

        // Calcular el precio total sumando los items
        const totalPrice = items?.reduce((acc, item) => acc + (Number(item.price) * (item.qty || 1)), 0) || 0;

        // Usar transacción para asegurar atomicidad
        return await this.orderRepository.manager.transaction(async (manager) => {
            const order = manager.create(Order, {
                ...orderData,
                code,
                totalPrice,
                status: OrderStatus.PENDING,
            });

            const savedOrder = await manager.save(Order, order);

            if (items && items.length > 0) {
                const orderItems = items.map((item) =>
                    manager.create(OrderItem, {
                        ...item,
                        orderId: savedOrder.id,
                        doneQty: 0,
                    }),
                );
                await manager.save(OrderItem, orderItems);
            }

            // Usar el manager para encontrar el pedido dentro de la misma transacción
            const result = await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: ['items']
            });

            if (!result) throw new NotFoundException('Error al recuperar el pedido recién creado');
            return result;
        });
    }

    /**
     * Actualizar progreso (doneQty) de un ítem
     */
    async updateProgress(orderId: string, itemId: string, updateProgressDto: UpdateProgressDto): Promise<Order> {
        const { doneQty } = updateProgressDto;

        const item = await this.orderItemRepository.findOne({
            where: { id: itemId, orderId: orderId },
        });

        if (!item) {
            throw new NotFoundException(`Ítem ${itemId} no encontrado en el pedido ${orderId}`);
        }

        if (doneQty > item.qty) {
            throw new BadRequestException('La cantidad completada no puede ser mayor a la cantidad total');
        }

        item.doneQty = doneQty;
        await this.orderItemRepository.save(item);

        // Opcional: Si todos los ítems están terminados, marcar pedido como DONE
        const allItems = await this.orderItemRepository.find({ where: { orderId } });
        const isOrderComplete = allItems.every((i) => i.doneQty === i.qty);

        if (isOrderComplete) {
            await this.orderRepository.update(orderId, { status: OrderStatus.DONE });
            // También finalizamos todos los trabajos de este pedido
            await this.syncJobsOnCompletion(undefined, orderId);
        } else if (doneQty > 0) {
            await this.orderRepository.update(orderId, { status: OrderStatus.IN_PROGRESS });
            if (doneQty === item.qty) {
                // Si este ítem específico se terminó, finalizamos sus trabajos
                await this.syncJobsOnCompletion(itemId);
            }
        }

        return this.findOne(orderId);
    }

    /**
     * Actualizar estado manual del pedido (para compatibilidad o extras)
     */
    async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
        const { status, notes } = updateStatusDto;

        const updateData: any = { status };
        if (notes !== undefined) {
            updateData.notes = notes;
        }

        await this.orderRepository.update(id, updateData);

        if (status === OrderStatus.DONE) {
            await this.syncJobsOnCompletion(undefined, id);
        }

        return this.findOne(id);
    }

    /**
     * Sincroniza y finaliza trabajos de producción cuando se completa un ítem o pedido
     */
    private async syncJobsOnCompletion(orderItemId?: string, orderId?: string) {
        const where: any = {};
        if (orderItemId) where.orderItemId = orderItemId;
        if (orderId) where.orderId = orderId;

        const activeJobs = await this.jobRepository.find({
            where: {
                ...where,
                status: In([JobStatus.QUEUED, JobStatus.PRINTING, JobStatus.PAUSED])
            }
        });

        for (const job of activeJobs) {
            // Marcar trabajo como terminado
            await this.jobRepository.update(job.id, { status: JobStatus.DONE });

            // Si tenía impresora, liberarla
            if (job.printerId) {
                await this.printerRepository.update(job.printerId, { status: PrinterStatus.IDLE });
            }
        }
    }
}
