"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const order_site_info_entity_1 = require("./entities/order-site-info.entity");
const enums_1 = require("../common/enums");
const production_job_entity_1 = require("../jobs/entities/production-job.entity");
const order_status_history_entity_1 = require("../history/entities/order-status-history.entity");
const order_failure_entity_1 = require("./entities/order-failure.entity");
const material_entity_1 = require("../materials/entities/material.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const order_strategy_provider_1 = require("./order-strategy.provider");
const order_workflow_service_1 = require("./order-workflow.service");
const order_financial_service_1 = require("./order-financial.service");
let OrdersService = class OrdersService {
    constructor(orderRepository, orderItemRepository, jobRepository, statusHistoryRepository, orderFailureRepository, materialRepository, paymentRepository, strategyProvider, workflowService, financialService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.jobRepository = jobRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.orderFailureRepository = orderFailureRepository;
        this.materialRepository = materialRepository;
        this.paymentRepository = paymentRepository;
        this.strategyProvider = strategyProvider;
        this.workflowService = workflowService;
        this.financialService = financialService;
    }
    async findAll(query) {
        const { businessId, status, statuses, excludeStatuses, type, page = 1, pageSize = 50, search } = query;
        const where = {};
        if (businessId)
            where.businessId = businessId;
        if (status) {
            where.status = status;
        }
        else if (statuses) {
            const statusArray = typeof statuses === 'string' ? statuses.split(',') : statuses;
            where.status = (0, typeorm_2.In)(statusArray);
        }
        if (excludeStatuses) {
            const excludeArray = typeof excludeStatuses === 'string' ? excludeStatuses.split(',') : excludeStatuses;
            where.status = (0, typeorm_2.Not)((0, typeorm_2.In)(excludeArray));
        }
        if (type)
            where.type = type;
        let whereCondition = { ...where };
        if (search) {
            whereCondition = [
                { ...where, clientName: (0, typeorm_2.ILike)(`%${search}%`) },
                { ...where, code: (0, typeorm_2.ILike)(`%${search}%`) }
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
    async findListing(query) {
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
        }
        else if (statuses) {
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
        }
        else if (startDate) {
            qb.andWhere('order.createdAt >= :startDate', { startDate });
        }
        else if (endDate) {
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
    async getSummaryStats(businessId) {
        const volResult = await this.orderRepository.createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status != :cancelled', { cancelled: enums_1.OrderStatus.CANCELLED })
            .select('SUM(order.totalPrice)', 'total')
            .getRawOne();
        const totalVolume = Number(volResult?.total) || 0;
        const activeOrders = await this.orderRepository.createQueryBuilder('order')
            .leftJoin('order.items', 'items')
            .leftJoin('order.payments', 'payments')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status NOT IN (:...exclude)', { exclude: [enums_1.OrderStatus.DELIVERED, enums_1.OrderStatus.CANCELLED] })
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
    async getBudgetSummaryStats(businessId) {
        const BUDGET_STAGES = [
            enums_1.OrderStatus.QUOTATION,
            enums_1.OrderStatus.BUDGET_GENERATED,
            enums_1.OrderStatus.BUDGET_REJECTED,
            enums_1.OrderStatus.SURVEY_DESIGN
        ];
        const CONVERTED_STAGES = [
            enums_1.OrderStatus.APPROVED,
            enums_1.OrderStatus.OFFICIAL_ORDER,
            enums_1.OrderStatus.IN_PROGRESS,
            enums_1.OrderStatus.DONE,
            enums_1.OrderStatus.READY,
            enums_1.OrderStatus.DELIVERED
        ];
        const allRelevantOrders = await this.orderRepository.createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status NOT IN (:...exclude)', { exclude: [enums_1.OrderStatus.CANCELLED, enums_1.OrderStatus.SITE_VISIT, enums_1.OrderStatus.SITE_VISIT_DONE] })
            .select(['order.id', 'order.totalPrice', 'order.status'])
            .getMany();
        const currentBudgets = allRelevantOrders.filter(o => BUDGET_STAGES.includes(o.status));
        const totalBudgeted = this.financialService.calculateItemsTotal(currentBudgets);
        const pendingApprovalCount = currentBudgets.filter(b => b.status === enums_1.OrderStatus.BUDGET_GENERATED).length;
        const totalActiveAndConverted = allRelevantOrders.length;
        const converted = allRelevantOrders.filter(o => CONVERTED_STAGES.includes(o.status)).length;
        const conversionRate = totalActiveAndConverted > 0 ? (converted / totalActiveAndConverted) * 100 : 0;
        return {
            totalBudgeted,
            pendingApprovalCount,
            conversionRate: Math.round(conversionRate * 10) / 10
        };
    }
    async findVisits(query) {
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
        const VISIT_STATUSES = [
            enums_1.OrderStatus.SITE_VISIT,
            enums_1.OrderStatus.SITE_VISIT_DONE,
            enums_1.OrderStatus.VISITA_REPROGRAMADA,
            enums_1.OrderStatus.VISITA_CANCELADA
        ];
        if (status) {
            qb.andWhere('order.status = :status', { status });
        }
        else {
            qb.andWhere('order.status IN (:...statuses)', { statuses: VISIT_STATUSES });
        }
        if (responsableId) {
            qb.andWhere('order.responsableGeneralId = :responsableId', { responsableId });
        }
        if (startDate && endDate) {
            qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        }
        else if (startDate) {
            qb.andWhere('order.createdAt >= :startDate', { startDate });
        }
        else if (endDate) {
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
    async findQuotations(query) {
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
            enums_1.OrderStatus.QUOTATION,
            enums_1.OrderStatus.BUDGET_GENERATED,
            enums_1.OrderStatus.BUDGET_REJECTED,
            enums_1.OrderStatus.SURVEY_DESIGN
        ];
        if (status) {
            qb.andWhere('order.status = :status', { status });
        }
        else {
            qb.andWhere('order.status IN (:...statuses)', { statuses: BUDGET_STATUSES });
        }
        if (responsableId) {
            qb.andWhere('order.responsableGeneralId = :responsableId', { responsableId });
        }
        if (startDate && endDate) {
            qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
        }
        else if (startDate) {
            qb.andWhere('order.createdAt >= :startDate', { startDate });
        }
        else if (endDate) {
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
    async findOne(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: [
                'items', 'customer', 'responsableGeneral',
                'jobs', 'jobs.responsable', 'business',
                'statusHistory', 'statusHistory.performedBy',
                'failures', 'failures.material', 'payments', 'siteInfo'
            ],
        });
        if (!order) {
            throw new common_1.NotFoundException(`Pedido con ID ${id} no encontrado`);
        }
        return order;
    }
    async create(createOrderDto) {
        const { items, ...orderData } = createOrderDto;
        const code = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
        const calculatedTotalPrice = this.financialService.calculateItemsTotal(items);
        const totalPrice = createOrderDto.totalPrice !== undefined ? createOrderDto.totalPrice : calculatedTotalPrice;
        return await this.orderRepository.manager.transaction(async (manager) => {
            const business = await manager.findOne('Business', { where: { id: orderData.businessId } });
            const strategy = this.strategyProvider.getStrategy(business?.category);
            const initialStatus = createOrderDto.status || strategy.getInitialStatus(items);
            const order = manager.create(order_entity_1.Order, {
                ...orderData,
                code,
                totalPrice,
                status: initialStatus,
                siteInfo: createOrderDto.siteInfo ? manager.create(order_site_info_entity_1.OrderSiteInfo, createOrderDto.siteInfo) : null
            });
            const savedOrder = await manager.save(order_entity_1.Order, order);
            if (items && items.length > 0) {
                for (const itemData of items) {
                    const orderItem = manager.create(order_item_entity_1.OrderItem, {
                        ...itemData,
                        orderId: savedOrder.id,
                        doneQty: 0,
                    });
                    const savedItem = await manager.save(order_item_entity_1.OrderItem, orderItem);
                    await this.workflowService.createWorkflow(savedOrder, savedItem, strategy, manager);
                }
            }
            await strategy.onAfterCreate(savedOrder, manager);
            const result = await manager.findOne(order_entity_1.Order, {
                where: { id: savedOrder.id },
                relations: ['items', 'responsableGeneral', 'jobs', 'business']
            });
            if (!result)
                throw new common_1.NotFoundException('Error al recuperar el pedido recién creado');
            return result;
        });
    }
    async syncOrderItemProgress(orderItemId) {
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
    async updateProgress(orderId, itemId, updateProgressDto, userId) {
        const { doneQty } = updateProgressDto;
        const item = await this.orderItemRepository.findOne({
            where: { id: itemId, orderId: orderId },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Ítem ${itemId} no encontrado en el pedido ${orderId}`);
        }
        if (doneQty > item.qty) {
            throw new common_1.BadRequestException('La cantidad completada no puede ser mayor a la cantidad total');
        }
        item.doneQty = doneQty;
        await this.orderItemRepository.save(item);
        const allItems = await this.orderItemRepository.find({ where: { orderId } });
        const isOrderComplete = allItems.every((i) => i.doneQty === i.qty);
        return await this.orderRepository.manager.transaction(async (manager) => {
            const order = await manager.findOne(order_entity_1.Order, { where: { id: orderId }, relations: ['business'] });
            if (!order)
                throw new common_1.NotFoundException('Pedido no encontrado');
            const strategy = this.strategyProvider.getStrategy(order.business?.category);
            if (isOrderComplete) {
                await manager.update(order_entity_1.Order, orderId, { status: enums_1.OrderStatus.DONE });
                const history = manager.create(order_status_history_entity_1.OrderStatusHistory, {
                    orderId,
                    fromStatus: order.status,
                    toStatus: enums_1.OrderStatus.DONE,
                    note: 'Completado automático por carga de progreso',
                    performedById: userId
                });
                await manager.save(order_status_history_entity_1.OrderStatusHistory, history);
                await strategy.releaseResources(order, manager, { targetStatus: enums_1.JobStatus.DONE });
            }
            else if (doneQty > 0) {
                if (order.status !== enums_1.OrderStatus.IN_PROGRESS) {
                    await manager.update(order_entity_1.Order, orderId, { status: enums_1.OrderStatus.IN_PROGRESS });
                    const history = manager.create(order_status_history_entity_1.OrderStatusHistory, {
                        orderId,
                        fromStatus: order.status,
                        toStatus: enums_1.OrderStatus.IN_PROGRESS,
                        note: 'Iniciado automático por carga de progreso',
                        performedById: userId
                    });
                    await manager.save(order_status_history_entity_1.OrderStatusHistory, history);
                }
                if (doneQty === item.qty) {
                    await strategy.releaseResources(order, manager, { itemId: itemId, targetStatus: enums_1.JobStatus.DONE });
                }
            }
            return await manager.findOne(order_entity_1.Order, {
                where: { id: orderId },
                relations: ['items', 'customer', 'responsableGeneral', 'payments']
            });
        });
    }
    async checkAndSetReadyStatus(orderId) {
        const jobs = await this.jobRepository.find({
            where: { orderId }
        });
        if (jobs.length === 0)
            return;
        const allJobsDone = jobs.every(j => j.status === enums_1.JobStatus.DONE);
        if (allJobsDone) {
            await this.orderRepository.update(orderId, { status: enums_1.OrderStatus.DONE });
            console.log(`[OrdersService] Pedido ${orderId} marcado como TERMINADO automáticamente.`);
        }
    }
    async reportFailure(id, reportFailureDto, userId) {
        const order = await this.findOne(id);
        const strategy = this.strategyProvider.getStrategy(order.business?.category);
        return await this.orderRepository.manager.transaction(async (manager) => {
            const { reason, wastedGrams, materialId, metadata } = reportFailureDto;
            const failure = manager.create(order_failure_entity_1.OrderFailure, {
                orderId: id,
                reason,
                wastedGrams,
                materialId,
            });
            await manager.save(order_failure_entity_1.OrderFailure, failure);
            const targetStatus = await strategy.handleProductionFailure(order, reportFailureDto, manager, userId);
            let totalWasted = wastedGrams;
            if (metadata?.materials && Array.isArray(metadata.materials)) {
                totalWasted = metadata.materials.reduce((sum, m) => sum + (m.wastedGrams || 0), 0);
            }
            const history = manager.create(order_status_history_entity_1.OrderStatusHistory, {
                orderId: id,
                fromStatus: order.status,
                toStatus: targetStatus,
                note: `Fallo reportado: ${reason} (${totalWasted}g desperdiciados)`,
                performedById: userId
            });
            await manager.save(order_status_history_entity_1.OrderStatusHistory, history);
            await manager.update(order_entity_1.Order, id, { status: targetStatus });
            return await manager.findOne(order_entity_1.Order, {
                where: { id },
                relations: [
                    'items', 'customer', 'responsableGeneral',
                    'jobs', 'jobs.responsable', 'business',
                    'statusHistory', 'statusHistory.performedBy',
                    'failures', 'failures.material', 'payments'
                ],
            });
        });
    }
    async updateStatus(id, updateStatusDto, userId) {
        const { status, type, clientName, totalPrice, totalSenias, dueDate, notes, responsableGeneralId, items } = updateStatusDto;
        const order = await this.findOne(id);
        const oldStatus = order.status;
        return await this.orderRepository.manager.transaction(async (manager) => {
            const updateData = {};
            if (status !== undefined)
                updateData.status = status;
            if (type !== undefined)
                updateData.type = type;
            if (clientName !== undefined)
                updateData.clientName = clientName;
            if (totalPrice !== undefined)
                updateData.totalPrice = totalPrice;
            if (totalSenias !== undefined)
                updateData.totalSenias = totalSenias;
            if (dueDate !== undefined)
                updateData.dueDate = dueDate;
            if (responsableGeneralId !== undefined)
                updateData.responsableGeneralId = responsableGeneralId;
            if (notes !== undefined)
                updateData.notes = notes;
            if (updateStatusDto.metadata !== undefined)
                updateData.metadata = updateStatusDto.metadata;
            if (updateStatusDto.siteInfo !== undefined) {
                let siteInfo = await manager.findOne(order_site_info_entity_1.OrderSiteInfo, { where: { orderId: id } });
                if (!siteInfo) {
                    siteInfo = manager.create(order_site_info_entity_1.OrderSiteInfo, { orderId: id });
                }
                Object.assign(siteInfo, updateStatusDto.siteInfo);
                await manager.save(order_site_info_entity_1.OrderSiteInfo, siteInfo);
            }
            if (items && items.length > 0) {
                for (const itemData of items) {
                    const { id: itemId, ...rest } = itemData;
                    if (itemId) {
                        await manager.update(order_item_entity_1.OrderItem, itemId, rest);
                    }
                    else {
                        const newItem = manager.create(order_item_entity_1.OrderItem, { ...rest, orderId: id });
                        await manager.save(order_item_entity_1.OrderItem, newItem);
                    }
                }
                if (totalPrice === undefined) {
                    updateData.totalPrice = this.financialService.calculateItemsTotal(items);
                }
            }
            if (Object.keys(updateData).length > 0) {
                await manager.update(order_entity_1.Order, id, updateData);
            }
            if ((status && status !== oldStatus) || notes) {
                const history = manager.create(order_status_history_entity_1.OrderStatusHistory, {
                    orderId: id,
                    fromStatus: oldStatus,
                    toStatus: status || oldStatus,
                    note: notes,
                    performedById: userId
                });
                await manager.save(order_status_history_entity_1.OrderStatusHistory, history);
            }
            if (status && status !== enums_1.OrderStatus.IN_PROGRESS) {
                const targetJobStatus = status === enums_1.OrderStatus.DONE ? enums_1.JobStatus.DONE : enums_1.JobStatus.CANCELLED;
                const strategy = this.strategyProvider.getStrategy(order.business?.category);
                await strategy.releaseResources(order, manager, { targetStatus: targetJobStatus });
            }
            return await manager.findOne(order_entity_1.Order, {
                where: { id },
                relations: [
                    'items', 'customer', 'responsableGeneral',
                    'jobs', 'jobs.responsable', 'business',
                    'statusHistory', 'statusHistory.performedBy',
                    'failures', 'failures.material', 'payments'
                ],
            });
        });
    }
    async addPayment(id, createPaymentDto) {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException(`Pedido ${id} no encontrado`);
        const payment = this.paymentRepository.create({
            orderId: id,
            ...createPaymentDto,
        });
        await this.paymentRepository.save(payment);
        return this.findOne(id);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __param(3, (0, typeorm_1.InjectRepository)(order_status_history_entity_1.OrderStatusHistory)),
    __param(4, (0, typeorm_1.InjectRepository)(order_failure_entity_1.OrderFailure)),
    __param(5, (0, typeorm_1.InjectRepository)(material_entity_1.Material)),
    __param(6, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        order_strategy_provider_1.OrderStrategyProvider,
        order_workflow_service_1.OrderWorkflowService,
        order_financial_service_1.OrderFinancialService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map