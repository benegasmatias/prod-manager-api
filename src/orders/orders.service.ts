import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, Not } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderSiteInfo } from './entities/order-site-info.entity';
import { OrderStatus, ProductionJobStatus as JobStatus, OrderItemStatus } from '../common/enums';
import { ProductionJob } from '../jobs/entities/production-job.entity';

import { CreateOrderDto, UpdateProgressDto, UpdateOrderStatusDto, FindOrdersDto, ReportFailureDto, FindVisitsDto, FindQuotationsDto, OrderSummaryResponseDto, BudgetSummaryResponseDto } from './dto/order.dto';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { OrderFailure } from './entities/order-failure.entity';
import { Material } from '../materials/entities/material.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
import { OrderStrategyProvider } from './order-strategy.provider';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderFinancialService } from './order-financial.service';
import { PlanUsageService } from '../businesses/plan-usage.service';

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
        private readonly planUsageService: PlanUsageService,
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
            relations: ['items', 'customer', 'responsableGeneral', 'payments', 'vehicle'],
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
        const { businessId, status, statuses, excludeStatuses, type, page = 1, pageSize = 50, search, startDate, endDate, responsableId, alertFilter, vehicleId } = query;

        const qb = this.orderRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.responsableGeneral', 'responsableGeneral')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.payments', 'payments')
            .leftJoinAndSelect('order.siteInfo', 'siteInfo')
            .leftJoinAndSelect('order.vehicle', 'vehicle')
            .leftJoinAndSelect('items.productionJob', 'job')
            .leftJoinAndSelect('job.machine', 'machine');

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
            qb.andWhere(
                '(order.clientName ILike :search OR order.code ILike :search OR order.notes ILike :search OR vehicle.plate ILike :search OR vehicle.brand ILike :search OR vehicle.model ILike :search OR CAST(order.metadata ->> \'plate\' AS TEXT) ILike :search)',
                { search: `%${search}%` }
            );
        }

        if (vehicleId) {
            qb.andWhere('order.vehicleId = :vehicleId', { vehicleId });
        }

        if (query.customerId) {
            qb.andWhere('order.customerId = :customerId', { customerId: query.customerId });
        }

        // Operational Alerts / Urgency Filtering
        let urgencyVal = query.urgency || alertFilter;
        if (urgencyVal) {
            const normalizedVal = urgencyVal.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const now = new Date();
            // REGLA: Excluir estados finales o "listos" para las alertas de urgencia operativas
            const excludedAlertStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.DONE, OrderStatus.READY];

            if (normalizedVal === 'VENCIDO' || normalizedVal === 'OVERDUE' || alertFilter === 'overdue') {
                // Overdue: Due date strictly before now
                qb.andWhere('order.dueDate < :now', { now });
                qb.andWhere('order.status NOT IN (:...excludedAlertStatuses)', { excludedAlertStatuses });
            } else if (normalizedVal === 'PROXIMO' || normalizedVal === 'DUE-SOON' || normalizedVal === 'PRÓXIMO' || alertFilter === 'due-soon') {
                // Due soon: Today or Tomorrow (as requested by user)
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

                qb.andWhere('order.dueDate BETWEEN :start AND :end', {
                    start: startOfToday,
                    end: endOfTomorrow
                });
                qb.andWhere('order.status NOT IN (:...excludedAlertStatuses)', { excludedAlertStatuses });
            }
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
                'items', 'items.productionJob', 'items.productionJob.machine',
                'customer', 'responsableGeneral',
                'jobs', 'jobs.operator', 'business',
                'statusHistory', 'statusHistory.performedBy',
                'failures', 'failures.material', 'payments', 'siteInfo', 'vehicle'
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
    async create(createOrderDto: CreateOrderDto, context?: { ip?: string, userAgent?: string }): Promise<Order> {
        const { items, ...orderData } = createOrderDto;

        // Validar límites del plan (Cuota de Pedidos Mensual)
        await this.planUsageService.ensureOrderCreationAllowed(orderData.businessId, context);

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
     * Sincroniza la cantidad producida (done_qty) y el ESTADO de un ítem 
     * basándose en sus trabajos de producción.
     */
    async syncOrderItemProgress(orderItemId: string, manager?: any) {
        const repo = manager ? manager.getRepository(ProductionJob) : this.jobRepository;
        const itemRepo = manager ? manager.getRepository(OrderItem) : this.orderItemRepository;

        const jobs = await repo.find({
            where: { orderItemId },
            relations: ['progress']
        });

        const totalDone = jobs.reduce((sum: number, job: any) => {
            const jobDone = job.progress?.reduce((innerSum: number, p: any) => innerSum + p.unitsDone, 0) || 0;
            return sum + jobDone;
        }, 0);

        // Mapeo Job -> Item Status
        let newItemStatus = OrderItemStatus.PENDING;

        const hasActiveJob = jobs.some((j: any) =>
            [JobStatus.QUEUED, JobStatus.IN_PROGRESS, JobStatus.PAUSED].includes(j.status as any)
        );
        const allDone = jobs.length > 0 && jobs.every((j: any) => j.status === JobStatus.DONE);
        const hasDone = jobs.some((j: any) => j.status === JobStatus.DONE);

        if (allDone) {
            newItemStatus = OrderItemStatus.DONE;
        } else if (hasActiveJob || (hasDone && !allDone)) {
            newItemStatus = OrderItemStatus.IN_PROGRESS;
        }

        await itemRepo.update(orderItemId, {
            doneQty: totalDone,
            status: newItemStatus
        });

        // Optimization: Try to get orderId from first job to avoid extra findOne
        let orderId = jobs.length > 0 ? jobs[0].orderId : null;

        if (!orderId) {
            const item = await itemRepo.findOne({ where: { id: orderItemId }, select: ['orderId'] });
            orderId = item?.orderId;
        }

        if (orderId) {
            await this.aggregateStatus(orderId, manager);
        }
    }

    /**
     * Calcula el estado global del pedido basado en el estado de sus items.
     * Reglas de Agregación:
     * - DONE: Todos los items están DONE.
     * - IN_PROGRESS: Al menos un item está IN_PROGRESS o DONE (pero no todos DONE).
     * - CANCELLED: Todos los items están CANCELLED.
     * - PENDING: Todos los items están PENDING (o no hay items).
     */
    async aggregateStatus(orderId: string, manager?: any, userId?: string) {
        const itemRepo = manager ? manager.getRepository(OrderItem) : this.orderItemRepository;
        const orderRepo = manager ? manager.getRepository(Order) : this.orderRepository;
        const historyRepo = manager ? manager.getRepository(OrderStatusHistory) : this.statusHistoryRepository;

        // Optimization: select only necessary fields and fetch in parallel
        const [items, order] = await Promise.all([
            itemRepo.find({ where: { orderId }, select: ['id', 'status', 'orderId'] }),
            orderRepo.findOne({ where: { id: orderId }, select: ['id', 'status'] })
        ]);

        if (!order || items.length === 0) return;

        let targetStatus = order.status;

        const allInStock = items.every(i => i.status === OrderItemStatus.IN_STOCK || i.status === OrderItemStatus.CANCELLED);
        const allDoneOrStock = items.every(i =>
            i.status === OrderItemStatus.DONE ||
            i.status === OrderItemStatus.IN_STOCK ||
            i.status === OrderItemStatus.CANCELLED
        );
        const allReadyDoneOrStock = items.every(i =>
            i.status === OrderItemStatus.READY ||
            i.status === OrderItemStatus.DONE ||
            i.status === OrderItemStatus.IN_STOCK ||
            i.status === OrderItemStatus.CANCELLED
        );
        const anyActive = items.some(i =>
            [OrderItemStatus.IN_PROGRESS, OrderItemStatus.READY, OrderItemStatus.DESIGN].includes(i.status as any)
        );
        const allCancelled = items.every(i => i.status === OrderItemStatus.CANCELLED);

        if (allCancelled) {
            targetStatus = OrderStatus.CANCELLED;
        } else if (allInStock) {
            targetStatus = OrderStatus.IN_STOCK;
        } else if (allDoneOrStock) {
            targetStatus = OrderStatus.DONE;
        } else if (allReadyDoneOrStock) {
            targetStatus = OrderStatus.READY;
        } else if (anyActive) {
            targetStatus = OrderStatus.IN_PROGRESS;
        } else {
            targetStatus = OrderStatus.PENDING;
        }

        if (targetStatus !== order.status) {
            await orderRepo.update(orderId, { status: targetStatus });
            const history = historyRepo.create({
                orderId,
                fromStatus: order.status,
                toStatus: targetStatus,
                note: 'Actualización automática por cambio en ítems',
                performedById: userId
            });
            await historyRepo.save(history);
        }
    }

    /**
     * Actualiza manualmente el estado de un ítem y dispara la agregación.
     * Solo permite transiciones simples: PENDING -> READY, PENDING -> CANCELLED, CANCELLED -> PENDING.
     */
    async updateItemStatus(orderId: string, itemId: string, payload: any, userId?: string) {
        const { status, force } = payload;

        return await this.orderRepository.manager.transaction(async manager => {
            const item = await manager.findOne(OrderItem, {
                where: { id: itemId, orderId },
                relations: ['productionJob']
            });
            if (!item) throw new NotFoundException('Ítem no encontrado');

            // 1. Validar conflictos con trabajos activos
            if (item.productionJob && [JobStatus.QUEUED, JobStatus.IN_PROGRESS, JobStatus.PAUSED].includes(item.productionJob.status as any)) {
                if (force) {
                    // Forzamos la liberación: Cancelamos el trabajo en máquina
                    await manager.update(ProductionJob, item.productionJob.id, {
                        status: JobStatus.CANCELLED,
                        metadata: { ...item.productionJob.metadata, forcedReleaseBy: userId, releaseDate: new Date() }
                    });
                } else {
                    throw new BadRequestException('El ítem tiene un trabajo activo en máquina. Debe liberarse primero para cambiar su estado manualmente.');
                }
            }

            const oldStatus = item.status;

            // 2. Aplicar el cambio
            const updateData: Partial<OrderItem> = { status };
            if (status === OrderItemStatus.READY || status === OrderItemStatus.DONE || status === OrderItemStatus.IN_STOCK) {
                updateData.doneQty = item.qty;
            } else if (status === OrderItemStatus.PENDING) {
                updateData.doneQty = 0;
            }

            await manager.update(OrderItem, itemId, updateData);

            // 3. Auditoría básica en el pedido
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                relations: ['business']
            });
            if (order) {
                const history = manager.create(OrderStatusHistory, {
                    orderId,
                    fromStatus: order.status,
                    toStatus: order.status,
                    note: `[ITEM] "${item.name}": ${oldStatus} -> ${status}`,
                    performedById: userId
                });
                await manager.save(OrderStatusHistory, history);

                // AUTO-CREATE PRODUCTION JOB IF ENTERING DESIGN
                if (status === OrderItemStatus.DESIGN && !item.productionJob) {
                    const strategy = this.strategyProvider.getStrategy(order.business?.category);
                    // Refresh item state with new status for workflow service
                    item.status = status;
                    await this.workflowService.createWorkflow(order, item, strategy, manager);
                }
            }

            // 4. Agregación
            await this.aggregateStatus(orderId, manager, userId);

            return await manager.findOne(OrderItem, { where: { id: itemId } });
        });
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

            // 4. Agregación (El estado del pedido derivará de sus ítems automáticamente)
            await this.aggregateStatus(id, manager, userId);

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
    async update(id: string, updateDto: UpdateOrderStatusDto, userId?: string): Promise<Order> {
        return this.updateStatus(id, updateDto, userId);
    }

    async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId?: string): Promise<Order> {
        const { status, type, clientName, totalPrice, totalSenias, dueDate, notes, responsableGeneralId, items, vehicleId } = updateStatusDto;

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
            if (vehicleId !== undefined) updateData.vehicleId = vehicleId;

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
                    'failures', 'failures.material', 'payments', 'vehicle'
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
    async getWorkload(businessId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
        const qb = this.orderRepository.createQueryBuilder('order')
            .select("DATE(order.dueDate)", "date")
            .addSelect("COUNT(order.id)", "count")
            .where("order.businessId = :businessId", { businessId })
            .andWhere("order.dueDate IS NOT NULL")
            .andWhere("order.status NOT IN (:...excludedStatuses)", { excludedStatuses: [OrderStatus.CANCELLED] });

        if (startDate) {
            qb.andWhere("order.dueDate >= :startDate", { startDate });
        }
        if (endDate) {
            qb.andWhere("order.dueDate <= :endDate", { endDate });
        }

        qb.groupBy("DATE(order.dueDate)")
            .orderBy("date", "ASC");

        return qb.getRawMany();
    }
    async remove(id: string): Promise<void> {
        const order = await this.findOne(id);
        await this.orderRepository.remove(order);
    }
}
