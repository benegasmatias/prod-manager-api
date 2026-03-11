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
const enums_1 = require("../common/enums");
const production_job_entity_1 = require("../jobs/entities/production-job.entity");
const printer_entity_1 = require("../printers/entities/printer.entity");
const order_status_history_entity_1 = require("../history/entities/order-status-history.entity");
const order_failure_entity_1 = require("./entities/order-failure.entity");
const material_entity_1 = require("../materials/entities/material.entity");
let OrdersService = class OrdersService {
    constructor(orderRepository, orderItemRepository, jobRepository, printerRepository, statusHistoryRepository, orderFailureRepository, materialRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.jobRepository = jobRepository;
        this.printerRepository = printerRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.orderFailureRepository = orderFailureRepository;
        this.materialRepository = materialRepository;
    }
    async findAll(query) {
        const { businessId, status, type } = query;
        const where = {};
        if (businessId)
            where.businessId = businessId;
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        return this.orderRepository.find({
            where,
            relations: ['items', 'customer', 'responsableGeneral', 'jobs'],
            order: {
                updatedAt: 'DESC',
                dueDate: 'ASC',
                createdAt: 'DESC',
                priority: 'DESC',
            },
        });
    }
    async findOne(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: [
                'items', 'customer', 'responsableGeneral',
                'jobs', 'jobs.responsable', 'business',
                'statusHistory', 'statusHistory.performedBy',
                'failures', 'failures.material'
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
        const totalPrice = items?.reduce((acc, item) => {
            const basePrice = Number(item.price) * (item.qty || 1);
            const designPrice = Number(item.metadata?.precioDiseno) || 0;
            return acc + basePrice + (designPrice * (item.qty || 1));
        }, 0) || 0;
        return await this.orderRepository.manager.transaction(async (manager) => {
            const business = await manager.findOne('Business', { where: { id: orderData.businessId } });
            let initialStatus = enums_1.OrderStatus.PENDING;
            if (business?.category === 'IMPRESION_3D') {
                const needsDesign = items?.some(item => item.metadata?.seDiseñaSTL === true || item.metadata?.seDiseñaSTL === 'true');
                if (needsDesign) {
                    initialStatus = enums_1.OrderStatus.DESIGN;
                }
            }
            const order = manager.create(order_entity_1.Order, {
                ...orderData,
                code,
                totalPrice,
                status: initialStatus,
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
                    if (business?.category === 'METALURGICA' || business?.category === 'CARPINTERIA') {
                        const stages = [
                            { title: 'Diseño / Preparación', rank: 10 },
                            { title: 'Corte / Dimensionado', rank: 20 },
                            { title: 'Soldadura / Unión', rank: 30 },
                            { title: 'Armado / Ensamble', rank: 40 },
                            { title: 'Pintura / Acabado', rank: 50 }
                        ];
                        const jobs = stages.map(s => manager.create(production_job_entity_1.ProductionJob, {
                            orderId: savedOrder.id,
                            orderItemId: savedItem.id,
                            title: s.title,
                            totalUnits: savedItem.qty || 1,
                            status: enums_1.JobStatus.QUEUED,
                            sortRank: s.rank,
                            responsableId: savedOrder.responsableGeneralId
                        }));
                        await manager.save(production_job_entity_1.ProductionJob, jobs);
                    }
                }
            }
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
        if (isOrderComplete) {
            await this.orderRepository.update(orderId, { status: enums_1.OrderStatus.DONE });
            const history = this.statusHistoryRepository.create({
                orderId,
                fromStatus: enums_1.OrderStatus.IN_PROGRESS,
                toStatus: enums_1.OrderStatus.DONE,
                note: 'Completado automático por carga de progreso',
                performedById: userId
            });
            await this.statusHistoryRepository.save(history);
            await this.releasePrintersForOrder(orderId, enums_1.JobStatus.DONE);
        }
        else if (doneQty > 0) {
            const oldOrder = await this.orderRepository.findOneBy({ id: orderId });
            if (oldOrder && oldOrder.status !== enums_1.OrderStatus.IN_PROGRESS) {
                await this.orderRepository.update(orderId, { status: enums_1.OrderStatus.IN_PROGRESS });
                const history = this.statusHistoryRepository.create({
                    orderId,
                    fromStatus: oldOrder.status,
                    toStatus: enums_1.OrderStatus.IN_PROGRESS,
                    note: 'Iniciado automático por carga de progreso',
                    performedById: userId
                });
                await this.statusHistoryRepository.save(history);
            }
            if (doneQty === item.qty) {
                await this.releasePrintersForOrder(orderId, enums_1.JobStatus.DONE, itemId);
            }
        }
        return this.findOne(orderId);
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
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order) {
            throw new common_1.NotFoundException(`Pedido ${id} no encontrado`);
        }
        const { reason, wastedGrams, materialId, moveToReprint, metadata } = reportFailureDto;
        const failure = this.orderFailureRepository.create({
            orderId: id,
            reason,
            wastedGrams,
            materialId,
        });
        await this.orderFailureRepository.save(failure);
        if (metadata?.materials && Array.isArray(metadata.materials)) {
            for (const matSpec of metadata.materials) {
                const { materialId: matId, wastedGrams: wasted } = matSpec;
                if (!matId || !wasted)
                    continue;
                const material = await this.materialRepository.findOneBy({ id: matId });
                if (material) {
                    const newRemaining = Math.max(0, material.remainingWeightGrams - wasted);
                    await this.materialRepository.update(material.id, { remainingWeightGrams: newRemaining });
                    console.log(`[Auditoría Fallo Multi] Descontados ${wasted}g de ${material.name}.`);
                }
            }
        }
        else if (materialId && wastedGrams > 0) {
            const material = await this.materialRepository.findOneBy({ id: materialId });
            if (material) {
                const newRemaining = Math.max(0, material.remainingWeightGrams - wastedGrams);
                await this.materialRepository.update(material.id, { remainingWeightGrams: newRemaining });
                console.log(`[Auditoría Fallo] Descontados ${wastedGrams}g de ${material.name} por fallo en pedido ${id}.`);
            }
        }
        const targetStatus = moveToReprint ? enums_1.OrderStatus.REPRINT_PENDING : enums_1.OrderStatus.FAILED;
        let totalWasted = wastedGrams;
        if (metadata?.materials && Array.isArray(metadata.materials)) {
            totalWasted = metadata.materials.reduce((sum, m) => sum + (m.wastedGrams || 0), 0);
        }
        const history = this.statusHistoryRepository.create({
            orderId: id,
            fromStatus: order.status,
            toStatus: targetStatus,
            note: `Fallo reportado: ${reason} (${totalWasted}g desperdiciados)`,
            performedById: userId
        });
        await this.statusHistoryRepository.save(history);
        order.status = targetStatus;
        await this.orderRepository.save(order);
        return this.findOne(id);
    }
    async updateStatus(id, updateStatusDto, userId) {
        const { status, type, clientName, totalPrice, dueDate, notes, responsableGeneralId } = updateStatusDto;
        const order = await this.findOne(id);
        const oldStatus = order.status;
        const updateData = {};
        if (status !== undefined)
            updateData.status = status;
        if (type !== undefined)
            updateData.type = type;
        if (clientName !== undefined)
            updateData.clientName = clientName;
        if (totalPrice !== undefined)
            updateData.totalPrice = totalPrice;
        if (dueDate !== undefined)
            updateData.dueDate = dueDate;
        if (responsableGeneralId !== undefined)
            updateData.responsableGeneralId = responsableGeneralId;
        if (Object.keys(updateData).length > 0) {
            await this.orderRepository.update(id, updateData);
        }
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
        if (status && status !== enums_1.OrderStatus.IN_PROGRESS) {
            const targetJobStatus = status === enums_1.OrderStatus.DONE ? enums_1.JobStatus.DONE : enums_1.JobStatus.CANCELLED;
            await this.releasePrintersForOrder(id, targetJobStatus);
        }
        return this.findOne(id);
    }
    async releasePrintersForOrder(orderId, targetJobStatus = enums_1.JobStatus.DONE, orderItemId) {
        const where = { orderId };
        if (orderItemId)
            where.orderItemId = orderItemId;
        const activeJobs = await this.jobRepository.find({
            where: {
                ...where,
                status: (0, typeorm_2.In)([enums_1.JobStatus.QUEUED, enums_1.JobStatus.PRINTING, enums_1.JobStatus.PAUSED])
            }
        });
        for (const job of activeJobs) {
            await this.jobRepository.update(job.id, { status: targetJobStatus });
            if (job.printerId) {
                await this.printerRepository.update(job.printerId, { status: enums_1.PrinterStatus.IDLE });
                console.log(`[Auditoría] Impresora ${job.printerId} liberada al cambiar estado de pedido ${orderId}`);
            }
        }
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __param(3, (0, typeorm_1.InjectRepository)(printer_entity_1.Printer)),
    __param(4, (0, typeorm_1.InjectRepository)(order_status_history_entity_1.OrderStatusHistory)),
    __param(5, (0, typeorm_1.InjectRepository)(order_failure_entity_1.OrderFailure)),
    __param(6, (0, typeorm_1.InjectRepository)(material_entity_1.Material)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map