import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, Not, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderSiteInfo } from './entities/order-site-info.entity';
import { OrderStatus, ProductionJobStatus as JobStatus, MachineStatus } from '../common/enums';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Machine } from '../machines/entities/machine.entity';
import { CreateOrderDto, UpdateProgressDto, UpdateOrderStatusDto, FindOrdersDto, ReportFailureDto, FindVisitsDto, FindQuotationsDto, OrderSummaryResponseDto, BudgetSummaryResponseDto } from './dto/order.dto';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { OrderFailure } from './entities/order-failure.entity';
import { Material } from '../materials/entities/material.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
import { OrderStrategyProvider } from './order-strategy.provider';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderFinancialService } from './order-financial.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(ProductionJob)
        private readonly jobRepository: Repository<ProductionJob>,
        @InjectRepository(OrderStatusHistory)
        private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
        @InjectRepository(OrderFailure)
        private readonly orderFailureRepository: Repository<OrderFailure>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        private readonly strategyProvider: OrderStrategyProvider,
        private readonly workflowService: OrderWorkflowService,
        private readonly financialService: OrderFinancialService,
    ) { }

    /**
     * Obtener pedidos ordenados por dueDate asc, luego priority desc (asumiendo que mayor nro es más prioridad)
     */
    async findAll(query: FindOrdersDto): Promise<{ data: Order[], total: number }> {
        const { businessId, status, statuses, excludeStatuses, type, page = 1, pageSize = 50, search } = query;
        const where: any = {};
        if (businessId) where.businessId = businessId;
        
        if (status) {
            where.status = status;
        } else if (statuses) {
            const statusArray = typeof statuses === 'string' ? statuses.split(',') : statuses;
            where.status = In(statusArray);
        }

        if (excludeStatuses) {
            const excludeArray = typeof excludeStatuses === 'string' ? excludeStatuses.split(',') : excludeStatuses;
            where.status = Not(In(excludeArray));
        }

        if (type) where.type = type;

        let whereCondition: any = { ...where };
        if (search) {
            whereCondition = [
                { ...where, clientName: ILike(`%${search}%`) },
                { ...where, code: ILike(`%${search}%`) }
            ];
        }

        const [data, total] = await this.orderRepository.findAndCount({
            where: whereCondition,
            relations: ['items', 'customer', 'responsableGeneral', 'payments'],
            order: {
                updatedAt: 'DESC',
                dueDate: 'ASC',
                createdAt: 'DESC',
                priority: 'DESC',
            },
            take: pageSize,
            skip: (page - 1) * pageSize,
        });

        return { data, total };
    }

    /**
     * Versión Optimizada para Listados
     * Excluye campos pesados como metadatos y jobs.
     */
    async findListing(query: FindOrdersDto): Promise<{ data: Order[], total: number }> {
        const { businessId, status, statuses, excludeStatuses, type, page = 1, pageSize = 50, search, startDate, endDate, responsableId } = query;
        
        const qb = this.orderRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.responsableGeneral', 'responsableGeneral')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.payments', 'payments')
            .leftJoinAndSelect('order.siteInfo', 'siteInfo')
            .select([
                'order.id', 'order.businessId', 'order.clientName', 'order.dueDate', 'order.priority', 
                'order.status', 'order.type', 'order.createdAt', 'order.updatedAt', 'order.totalPrice', 
                'order.code', 'order.responsableGeneralId', 'order.customerId', 'order.totalSenias',
                'customer.id', 'customer.name', 'customer.phone',
                'responsableGeneral.id', 'responsableGeneral.firstName', 'responsableGeneral.lastName',
                'items.id', 'items.name', 'items.price', 'items.qty', 'items.deposit',
                'payments.id', 'payments.amount',
                'siteInfo.id', 'siteInfo.address', 'siteInfo.visitDate', 'siteInfo.visitTime'
            ]);

        if (businessId) {
            qb.andWhere('order.businessId = :businessId', { businessId });
        }
        
        if (status) {
            qb.andWhere('order.status = :status', { status });
        } else if (statuses) {
            const statusArray = Array.isArray(statuses) ? statuses : statuses.split(',');
            qb.andWhere('order.status IN (:...statuses)', { statuses: statusArray });
        }

        if (excludeStatuses) {
            const excludeArray = Array.isArray(excludeStatuses) ? excludeStatuses : excludeStatuses.split(',');
            qb.andWhere('order.status NOT IN (:...excludeArray)', { excludeArray });
        }

        if (type) {
            qb.andWhere('order.type = :type', { type });
        }

        if (responsableId) {
            qb.andWhere('order.responsableGeneralId = :responsableId', { responsableId });
        }

        if (startDate && endDate) {
            qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        } else if (startDate) {
            qb.andWhere('order.createdAt >= :startDate', { startDate });
        } else if (endDate) {
            qb.andWhere('order.createdAt <= :endDate', { endDate });
        }

        if (search) {
            qb.andWhere('(order.clientName ILike :search OR order.code ILike :search)', { search: `%${search}%` });
        }

        const [data, total] = await qb
            .orderBy('order.updatedAt', 'DESC')
            .take(pageSize)
            .skip((page - 1) * pageSize)
            .getManyAndCount();

        return { data, total };
    }

    async getSummaryStats(businessId: string): Promise<OrderSummaryResponseDto> {
        // Volumen Total: Suma de todos los pedidos no cancelados
        const volResult = await this.orderRepository.createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
            .select('SUM(order.totalPrice)', 'total')
            .getRawOne();

        const totalVolume = Number(volResult?.total) || 0;

        // Pedidos Activos y Saldo Pendiente
        const activeOrders = await this.orderRepository.createQueryBuilder('order')
            .leftJoin('order.items', 'items')
            .leftJoin('order.payments', 'payments')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status NOT IN (:...exclude)', { exclude: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] })
            .select([
                'order.id', 'order.totalPrice',
                'items.id', 'items.deposit',
                'payments.id', 'payments.amount'
            ])
            .getMany();

        const pendingBalance = activeOrders.reduce((acc, order) => {
            return acc + this.financialService.calculatePendingBalance(order);
        }, 0);

        return {
            totalVolume,
            pendingBalance,
            activeCount: activeOrders.length
        };
    }

    async getBudgetSummaryStats(businessId: string): Promise<BudgetSummaryResponseDto> {
        const BUDGET_STAGES = [
            OrderStatus.QUOTATION,
            OrderStatus.BUDGET_GENERATED,
            OrderStatus.BUDGET_REJECTED,
            OrderStatus.SURVEY_DESIGN
        ];

        const CONVERTED_STAGES = [
            OrderStatus.APPROVED,
            OrderStatus.OFFICIAL_ORDER,
            OrderStatus.IN_PROGRESS,
            OrderStatus.DONE,
            OrderStatus.READY,
            OrderStatus.DELIVERED
        ];

        // Todos los pedidos que alguna vez fueron presupuestos o lo son ahora
        // Simplificación: Pedidos en estados de presupuesto O pedidos que tienen historial de haber estado ahí
        // Por ahora, tomaremos presupuestos actuales + órdenes oficiales (que se asume vinieron de presupuesto)
        
        const allRelevantOrders = await this.orderRepository.createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status NOT IN (:...exclude)', { exclude: [OrderStatus.CANCELLED, OrderStatus.SITE_VISIT, OrderStatus.SITE_VISIT_DONE] })
            .select(['order.id', 'order.totalPrice', 'order.status'])
            .getMany();

        const currentBudgets = allRelevantOrders.filter(o => BUDGET_STAGES.includes(o.status));
        const totalBudgeted = this.financialService.calculateItemsTotal(currentBudgets);
        const pendingApprovalCount = currentBudgets.filter(b => b.status === OrderStatus.BUDGET_GENERATED).length;

        // Tasa de conversión (Aproximada: órdenes oficiales / total histórico relevante)
        const totalActiveAndConverted = allRelevantOrders.length;
        const converted = allRelevantOrders.filter(o => CONVERTED_STAGES.includes(o.status)).length;
        const conversionRate = totalActiveAndConverted > 0 ? (converted / totalActiveAndConverted) * 100 : 0;

        return {
            totalBudgeted,
            pendingApprovalCount,
            conversionRate: Math.round(conversionRate * 10) / 10
        };
    }
    async findVisits(query: FindVisitsDto): Promise<{ data: Order[], total: number }> {
        const { businessId, status, page = 1, pageSize = 50, search, startDate, endDate, responsableId } = query;

        const qb = this.orderRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.responsableGeneral', 'responsableGeneral')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.siteInfo', 'siteInfo')
            .select([
                'order.id', 'order.businessId', 'order.clientName', 'order.status', 'order.code',
                'order.totalSenias', 'order.createdAt',
                'customer.id', 'customer.name',
                'responsableGeneral.id', 'responsableGeneral.firstName',
                'items.id', 'items.name', 'items.metadata',
                'siteInfo.id', 'siteInfo.address', 'siteInfo.visitDate', 'siteInfo.visitTime'
            ]);

        qb.andWhere('order.businessId = :businessId', { businessId });

        // Estados específicos de Visitas
        const VISIT_STATUSES = [
            OrderStatus.SITE_VISIT,
            OrderStatus.SITE_VISIT_DONE,
            OrderStatus.VISITA_REPROGRAMADA,
            OrderStatus.VISITA_CANCELADA
        ];

        if (status) {
            qb.andWhere('order.status = :status', { status });
        } else {
            qb.andWhere('order.status IN (:...statuses)', { statuses: VISIT_STATUSES });
        }

        if (responsableId) {
            qb.andWhere('order.responsableGeneralId = :responsableId', { responsableId });
        }

        if (startDate && endDate) {
            qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        } else if (startDate) {
            qb.andWhere('order.createdAt >= :startDate', { startDate });
        } else if (endDate) {
            qb.andWhere('order.createdAt <= :endDate', { endDate });
        }

        if (search) {
            qb.andWhere('(order.clientName ILike :search OR order.code ILike :search OR order.direccion_obra ILike :search)', { search: `%${search}%` });
        }

        const [data, total] = await qb
            .orderBy('order.createdAt', 'DESC')
            .take(pageSize)
            .skip((page - 1) * pageSize)
            .getManyAndCount();

        return { data, total };
    }

    async findQuotations(query: FindQuotationsDto): Promise<{ data: Order[], total: number }> {
        const { businessId, status, page = 1, pageSize = 50, search, startDate, endDate, responsableId } = query;

        const qb = this.orderRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.responsableGeneral', 'responsableGeneral')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.siteInfo', 'siteInfo')
            .select([
                'order.id', 'order.businessId', 'order.clientName', 'order.status', 'order.code',
                'order.totalPrice', 'order.totalSenias', 'order.createdAt', 'order.updatedAt',
                'customer.id', 'customer.name',
                'responsableGeneral.id', 'responsableGeneral.firstName',
                'items.id', 'items.name', 'items.price', 'items.qty',
                'siteInfo.id', 'siteInfo.address', 'siteInfo.visitDate', 'siteInfo.visitTime', 'siteInfo.visitObservations'
            ]);

        qb.andWhere('order.businessId = :businessId', { businessId });

        const BUDGET_STATUSES = [
            OrderStatus.QUOTATION,
            OrderStatus.BUDGET_GENERATED,
            OrderStatus.BUDGET_REJECTED,
            OrderStatus.SURVEY_DESIGN
        ];

        if (status) {
            qb.andWhere('order.status = :status', { status });
        } else {
            qb.andWhere('order.status IN (:...statuses)', { statuses: BUDGET_STATUSES });
        }

        if (responsableId) {
            qb.andWhere('order.responsableGeneralId = :responsableId', { responsableId });
        }

        if (startDate && endDate) {
            qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        } else if (startDate) {
            qb.andWhere('order.createdAt >= :startDate', { startDate });
        } else if (endDate) {
            qb.andWhere('order.createdAt <= :endDate', { endDate });
        }

        if (search) {
            qb.andWhere('(order.clientName ILike :search OR order.code ILike :search)', { search: `%${search}%` });
        }

        const [data, total] = await qb
            .orderBy('order.updatedAt', 'DESC')
            .take(pageSize)
            .skip((page - 1) * pageSize)
            .getManyAndCount();

        return { data, total };
    }

    /**
     * Obtener un pedido por ID con sus ítems
     */
    async findOne(id: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: [
                'items', 'customer', 'responsableGeneral',
                'jobs', 'jobs.operator', 'business',
                'statusHistory', 'statusHistory.performedBy',
                'failures', 'failures.material', 'payments', 'siteInfo'
            ],
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

        // Calcular el precio total sumando los ítems
        const calculatedTotalPrice = this.financialService.calculateItemsTotal(items);

        const totalPrice = createOrderDto.totalPrice !== undefined ? createOrderDto.totalPrice : calculatedTotalPrice;

        // Usar transacción para asegurar atomicidad
        return await this.orderRepository.manager.transaction(async (manager) => {
            const business = await manager.findOne('Business', { where: { id: orderData.businessId } }) as any;
            const strategy = this.strategyProvider.getStrategy(business?.category);

            const initialStatus = createOrderDto.status || strategy.getInitialStatus(items);

            const order = manager.create(Order, {
                ...orderData,
                code,
                totalPrice,
                status: initialStatus,
                siteInfo: createOrderDto.siteInfo ? manager.create(OrderSiteInfo, createOrderDto.siteInfo) : null
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

                    // Automatizar Workflow delegando en el servicio especializado y la estrategia
                    await this.workflowService.createWorkflow(savedOrder, savedItem, strategy, manager);
                }
            }

            // Ejecutar lógica post-creación de la estrategia
            await strategy.onAfterCreate(savedOrder, manager);

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

        // Usar transacción para actualizaciones de estado y liberación de recursos
        return await this.orderRepository.manager.transaction(async (manager) => {
            const order = await manager.findOne(Order, { where: { id: orderId }, relations: ['business'] });
            if (!order) throw new NotFoundException('Pedido no encontrado');
            const strategy = this.strategyProvider.getStrategy(order.business?.category);

            if (isOrderComplete) {
                await manager.update(Order, orderId, { status: OrderStatus.DONE });
                const history = manager.create(OrderStatusHistory, {
                    orderId,
                    fromStatus: order.status,
                    toStatus: OrderStatus.DONE,
                    note: 'Completado automático por carga de progreso',
                    performedById: userId
                });
                await manager.save(OrderStatusHistory, history);

                // Liberamos recursos delegando en la estrategia
                await strategy.releaseResources(order, manager, { targetStatus: JobStatus.DONE });
            } else if (doneQty > 0) {
                if (order.status !== OrderStatus.IN_PROGRESS) {
                    await manager.update(Order, orderId, { status: OrderStatus.IN_PROGRESS });
                    const history = manager.create(OrderStatusHistory, {
                        orderId,
                        fromStatus: order.status,
                        toStatus: OrderStatus.IN_PROGRESS,
                        note: 'Iniciado automático por carga de progreso',
                        performedById: userId
                    });
                    await manager.save(OrderStatusHistory, history);
                }
                
                if (doneQty === item.qty) {
                    // Si este ítem específico se terminó, liberamos sus recursos
                    await strategy.releaseResources(order, manager, { itemId: itemId, targetStatus: JobStatus.DONE });
                }
            }

            return await manager.findOne(Order, {
                where: { id: orderId },
                relations: ['items', 'customer', 'responsableGeneral', 'payments']
            });
        });
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

        const allJobsDone = jobs.every(j => (j.status as any) === JobStatus.DONE);

        if (allJobsDone) {
            await this.orderRepository.update(orderId, { status: OrderStatus.DONE });
            console.log(`[OrdersService] Pedido ${orderId} marcado como TERMINADO automáticamente.`);
        }
    }

    /**
     * Reportar un fallo en un pedido (específicamente Impresión 3D)
     */
    async reportFailure(id: string, reportFailureDto: ReportFailureDto, userId: string): Promise<Order> {
        const order = await this.findOne(id);
        const strategy = this.strategyProvider.getStrategy(order.business?.category);

        return await this.orderRepository.manager.transaction(async (manager) => {
            const { reason, wastedGrams, materialId, metadata } = reportFailureDto;

            // 1. Registrar el fallo
            const failure = manager.create(OrderFailure, {
                orderId: id,
                reason,
                wastedGrams,
                materialId,
            });
            await manager.save(OrderFailure, failure);

            // 2. Delegar lógica de negocio (asíncrona) a la estrategia del rubro
            const targetStatus = await strategy.handleProductionFailure(order, reportFailureDto, manager, userId);

            // 3. Registrar historia del cambio
            let totalWasted = wastedGrams;
            if (metadata?.materials && Array.isArray(metadata.materials)) {
                totalWasted = metadata.materials.reduce((sum: number, m: any) => sum + (m.wastedGrams || 0), 0);
            }

            const history = manager.create(OrderStatusHistory, {
                orderId: id,
                fromStatus: order.status,
                toStatus: targetStatus,
                note: `Fallo reportado: ${reason} (${totalWasted}g desperdiciados)`,
                performedById: userId
            });
            await manager.save(OrderStatusHistory, history);

            // 4. Actualizar estado final
            await manager.update(Order, id, { status: targetStatus });

            return await manager.findOne(Order, {
                where: { id },
                relations: [
                    'items', 'customer', 'responsableGeneral',
                    'jobs', 'jobs.operator', 'business',
                    'statusHistory', 'statusHistory.performedBy',
                    'failures', 'failures.material', 'payments'
                ],
            });
        });
    }

    /**
     * Actualizar estado manual del pedido (para compatibilidad o extras)
     */
    async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId?: string): Promise<Order> {
        const { status, type, clientName, totalPrice, totalSenias, dueDate, notes, responsableGeneralId, items } = updateStatusDto;

        const order = await this.findOne(id);
        const oldStatus = order.status;

        // Usar transacción para asegurar que la actualización de items y el pedido sea atómica
        return await this.orderRepository.manager.transaction(async (manager) => {
            const updateData: any = {};
            if (status !== undefined) updateData.status = status;
            if (type !== undefined) updateData.type = type;
            if (clientName !== undefined) updateData.clientName = clientName;
            if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
            if (totalSenias !== undefined) updateData.totalSenias = totalSenias;
            if (dueDate !== undefined) updateData.dueDate = dueDate;
            if (responsableGeneralId !== undefined) updateData.responsableGeneralId = responsableGeneralId;
            if (notes !== undefined) updateData.notes = notes;
            if (updateStatusDto.metadata !== undefined) updateData.metadata = updateStatusDto.metadata;

            // Actualizar siteInfo si viene en el DTO
            if (updateStatusDto.siteInfo !== undefined) {
                let siteInfo = await manager.findOne(OrderSiteInfo, { where: { orderId: id } });
                if (!siteInfo) {
                    siteInfo = manager.create(OrderSiteInfo, { orderId: id });
                }
                Object.assign(siteInfo, updateStatusDto.siteInfo);
                await manager.save(OrderSiteInfo, siteInfo);
            }

            // Si vienen items, los actualizamos
            if (items && items.length > 0) {
                for (const itemData of items) {
                    const { id: itemId, ...rest } = itemData;
                    if (itemId) {
                        await manager.update(OrderItem, itemId, rest);
                    } else {
                        const newItem = manager.create(OrderItem, { ...rest, orderId: id });
                        await manager.save(OrderItem, newItem);
                    }
                }

                // Si no se pasó un totalPrice explícito, usamos el calculado
                if (totalPrice === undefined) {
                    updateData.totalPrice = this.financialService.calculateItemsTotal(items);
                }
            }

            // Realizar actualización del pedido
            if (Object.keys(updateData).length > 0) {
                await manager.update(Order, id, updateData);
            }

            // Registrar historial si hubo cambio de estado o notas
            if ((status && status !== oldStatus) || notes) {
                const history = manager.create(OrderStatusHistory, {
                    orderId: id,
                    fromStatus: oldStatus,
                    toStatus: status || oldStatus,
                    note: notes,
                    performedById: userId
                });
                await manager.save(OrderStatusHistory, history);
            }

            // Si el estado ya no es "EN PROCESO", liberamos recursos asociados delegando en la estrategia
            if (status && status !== OrderStatus.IN_PROGRESS) {
                const targetJobStatus = status === OrderStatus.DONE ? JobStatus.DONE : JobStatus.CANCELLED;
                const strategy = this.strategyProvider.getStrategy(order.business?.category);
                await strategy.releaseResources(order, manager, { targetStatus: targetJobStatus });
            }

            return await manager.findOne(Order, {
                where: { id },
                relations: [
                    'items', 'customer', 'responsableGeneral',
                    'jobs', 'jobs.operator', 'business',
                    'statusHistory', 'statusHistory.performedBy',
                    'failures', 'failures.material', 'payments'
                ],
            });
        });
    }

    
    /**
     * Registrar un pago para un pedido
     */
    async addPayment(id: string, createPaymentDto: CreatePaymentDto): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order) throw new NotFoundException(`Pedido ${id} no encontrado`);

        const payment = this.paymentRepository.create({
            orderId: id,
            ...createPaymentDto,
        });
        await this.paymentRepository.save(payment);

        return this.findOne(id);
    }
}
