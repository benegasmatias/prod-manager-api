import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus, JobStatus, PrinterStatus } from '../common/enums';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Printer } from '../printers/entities/printer.entity';
import { CreateOrderDto, UpdateProgressDto, UpdateOrderStatusDto, FindOrdersDto, ReportFailureDto } from './dto/order.dto';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { OrderFailure } from './entities/order-failure.entity';
import { Material } from '../materials/entities/material.entity';

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
        @InjectRepository(OrderStatusHistory)
        private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
        @InjectRepository(OrderFailure)
        private readonly orderFailureRepository: Repository<OrderFailure>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
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
            relations: ['items', 'customer', 'responsableGeneral', 'jobs'],
            order: {
                dueDate: 'ASC',
                createdAt: 'DESC',
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
            relations: ['items', 'customer', 'responsableGeneral', 'jobs', 'jobs.responsable', 'business'],
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

        // Calcular el precio total sumando los items (incluyendo costo de diseño si existe en metadata)
        const totalPrice = items?.reduce((acc, item) => {
            const basePrice = Number(item.price) * (item.qty || 1);
            const designPrice = Number(item.metadata?.precioDiseno) || 0;
            return acc + basePrice + (designPrice * (item.qty || 1));
        }, 0) || 0;

        // Usar transacción para asegurar atomicidad
        return await this.orderRepository.manager.transaction(async (manager) => {
            // Obtener el rubro del negocio para automatizar workflow
            const business = await manager.findOne('Business', { where: { id: orderData.businessId } }) as any;

            let initialStatus = OrderStatus.PENDING;
            if (business?.category === 'IMPRESION_3D') {
                const needsDesign = items?.some(item => item.metadata?.seDiseñaSTL === true || item.metadata?.seDiseñaSTL === 'true');
                if (needsDesign) {
                    initialStatus = OrderStatus.DESIGN;
                }
            }

            const order = manager.create(Order, {
                ...orderData,
                code,
                totalPrice,
                status: initialStatus,
            });

            const savedOrder = await manager.save(Order, order);

            if (items && items.length > 0) {
                for (const itemData of items) {
                    const orderItem = manager.create(OrderItem, {
                        ...itemData,
                        orderId: savedOrder.id,
                        doneQty: 0,
                    });
                    const savedItem = await manager.save(OrderItem, orderItem);

                    // Automatizar Workflow según rubro
                    if (business?.category === 'METALURGICA' || business?.category === 'CARPINTERIA') {
                        const stages = [
                            { title: 'Diseño / Preparación', rank: 10 },
                            { title: 'Corte / Dimensionado', rank: 20 },
                            { title: 'Soldadura / Unión', rank: 30 },
                            { title: 'Armado / Ensamble', rank: 40 },
                            { title: 'Pintura / Acabado', rank: 50 }
                        ];

                        const jobs = stages.map(s => manager.create(ProductionJob, {
                            orderId: savedOrder.id,
                            orderItemId: savedItem.id,
                            title: s.title,
                            totalUnits: savedItem.qty || 1,
                            status: JobStatus.QUEUED,
                            sortRank: s.rank,
                            responsableId: savedOrder.responsableGeneralId
                        }));
                        await manager.save(ProductionJob, jobs);
                    }
                }
            }

            // Usar el manager para encontrar el pedido recién creado con todas sus relaciones
            const result = await manager.findOne(Order, {
                where: { id: savedOrder.id },
                relations: ['items', 'responsableGeneral', 'jobs', 'business']
            });

            if (!result) throw new NotFoundException('Error al recuperar el pedido recién creado');
            return result;
        });
    }

    /**
     * Sincroniza la cantidad producida (done_qty) de un ítem basándose en sus trabajos de producción.
     */
    async syncOrderItemProgress(orderItemId: string) {
        const jobs = await this.jobRepository.find({
            where: { orderItemId },
            relations: ['progress']
        });

        const totalDone = jobs.reduce((sum, job) => {
            const jobDone = job.progress?.reduce((innerSum, p) => innerSum + p.unitsDone, 0) || 0;
            return sum + jobDone;
        }, 0);

        await this.orderItemRepository.update(orderItemId, { doneQty: totalDone });

        const item = await this.orderItemRepository.findOne({ where: { id: orderItemId } });
        if (item) {
            await this.checkAndSetReadyStatus(item.orderId);
        }
    }

    /**
     * Actualizar progreso (doneQty) de un ítem
     */
    async updateProgress(orderId: string, itemId: string, updateProgressDto: UpdateProgressDto, userId?: string): Promise<Order> {
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
            // Registrar cambio automático en el historial
            const history = this.statusHistoryRepository.create({
                orderId,
                fromStatus: OrderStatus.IN_PROGRESS,
                toStatus: OrderStatus.DONE,
                note: 'Completado automático por carga de progreso',
                performedById: userId
            });
            await this.statusHistoryRepository.save(history);

            // También finalizamos todos los trabajos de este pedido
            await this.syncJobsOnCompletion(undefined, orderId);
        } else if (doneQty > 0) {
            const oldOrder = await this.orderRepository.findOneBy({ id: orderId });
            if (oldOrder && oldOrder.status !== OrderStatus.IN_PROGRESS) {
                await this.orderRepository.update(orderId, { status: OrderStatus.IN_PROGRESS });
                const history = this.statusHistoryRepository.create({
                    orderId,
                    fromStatus: oldOrder.status,
                    toStatus: OrderStatus.IN_PROGRESS,
                    note: 'Iniciado automático por carga de progreso',
                    performedById: userId
                });
                await this.statusHistoryRepository.save(history);
            }
            if (doneQty === item.qty) {
                // Si este ítem específico se terminó, finalizamos sus trabajos
                await this.syncJobsOnCompletion(itemId);
            }
        }

        return this.findOne(orderId);
    }

    /**
     * Verifica si se han terminado todos los trabajos de un pedido y lo marca como terminado.
     */
    async checkAndSetReadyStatus(orderId: string) {
        const jobs = await this.jobRepository.find({
            where: { orderId }
        });

        // Si no hay trabajos, no hacemos nada automatico (podria ser un pedido manual)
        if (jobs.length === 0) return;

        const allJobsDone = jobs.every(j => j.status === JobStatus.DONE);

        if (allJobsDone) {
            await this.orderRepository.update(orderId, { status: OrderStatus.DONE });
            console.log(`[OrdersService] Pedido ${orderId} marcado como TERMINADO automáticamente.`);
        }
    }

    /**
     * Reportar un fallo en un pedido (específicamente Impresión 3D)
     */
    async reportFailure(id: string, reportFailureDto: ReportFailureDto, userId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundException(`Pedido ${id} no encontrado`);
        }

        const { reason, wastedGrams, materialId, moveToReprint } = reportFailureDto;

        // Registrar la entidad de fallo
        const failure = this.orderFailureRepository.create({
            orderId: id,
            reason,
            wastedGrams,
            materialId,
        });
        await this.orderFailureRepository.save(failure);

        // Descontar material si se especificó
        if (materialId && wastedGrams > 0) {
            const material = await this.materialRepository.findOneBy({ id: materialId });
            if (material) {
                const newRemaining = Math.max(0, material.remainingWeightGrams - wastedGrams);
                await this.materialRepository.update(material.id, { remainingWeightGrams: newRemaining });
                console.log(`[Auditoría Fallo] Descontados ${wastedGrams}g de ${material.name} por fallo en pedido ${id}.`);
            }
        }

        // Actualizar el estado del pedido
        const targetStatus = moveToReprint ? OrderStatus.REPRINT_PENDING : OrderStatus.FAILED;

        // Agregar nota histórica
        const history = this.statusHistoryRepository.create({
            orderId: id,
            fromStatus: order.status,
            toStatus: targetStatus,
            note: `Fallo reportado: ${reason} (${wastedGrams}g desperdiciados)`,
            performedById: userId
        });
        await this.statusHistoryRepository.save(history);

        order.status = targetStatus;
        await this.orderRepository.save(order);

        return this.findOne(id);
    }

    /**
     * Actualizar estado manual del pedido (para compatibilidad o extras)
     */
    async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId?: string): Promise<Order> {
        const { status, notes, responsableGeneralId } = updateStatusDto;

        const order = await this.findOne(id);
        const oldStatus = order.status;

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (responsableGeneralId !== undefined) updateData.responsableGeneralId = responsableGeneralId;

        // Perform update on the order
        if (Object.keys(updateData).length > 0) {
            await this.orderRepository.update(id, updateData);
        }

        // Record history always if there's a status change OR if notes were provided for this event
        if ((status && status !== oldStatus) || notes) {
            const history = this.statusHistoryRepository.create({
                orderId: id,
                fromStatus: oldStatus,
                toStatus: status || oldStatus,
                note: notes,
                performedById: userId
            });
            await this.statusHistoryRepository.save(history);
        }

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
