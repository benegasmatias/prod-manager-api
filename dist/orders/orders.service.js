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
let OrdersService = class OrdersService {
    constructor(orderRepository, orderItemRepository, jobRepository, printerRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.jobRepository = jobRepository;
        this.printerRepository = printerRepository;
    }
    async findAll(query) {
        const { businessId, status } = query;
        const where = {};
        if (businessId)
            where.businessId = businessId;
        if (status)
            where.status = status;
        return this.orderRepository.find({
            where,
            relations: ['items'],
            order: {
                dueDate: 'ASC',
                priority: 'DESC',
            },
        });
    }
    async findOne(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['items'],
        });
        if (!order) {
            throw new common_1.NotFoundException(`Pedido con ID ${id} no encontrado`);
        }
        return order;
    }
    async create(createOrderDto) {
        const { items, ...orderData } = createOrderDto;
        const code = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
        const totalPrice = items?.reduce((acc, item) => acc + (Number(item.price) * (item.qty || 1)), 0) || 0;
        return await this.orderRepository.manager.transaction(async (manager) => {
            const order = manager.create(order_entity_1.Order, {
                ...orderData,
                code,
                totalPrice,
                status: enums_1.OrderStatus.PENDING,
            });
            const savedOrder = await manager.save(order_entity_1.Order, order);
            if (items && items.length > 0) {
                const orderItems = items.map((item) => manager.create(order_item_entity_1.OrderItem, {
                    ...item,
                    orderId: savedOrder.id,
                    doneQty: 0,
                }));
                await manager.save(order_item_entity_1.OrderItem, orderItems);
            }
            const result = await manager.findOne(order_entity_1.Order, {
                where: { id: savedOrder.id },
                relations: ['items']
            });
            if (!result)
                throw new common_1.NotFoundException('Error al recuperar el pedido recién creado');
            return result;
        });
    }
    async updateProgress(orderId, itemId, updateProgressDto) {
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
            await this.syncJobsOnCompletion(undefined, orderId);
        }
        else if (doneQty > 0) {
            await this.orderRepository.update(orderId, { status: enums_1.OrderStatus.IN_PROGRESS });
            if (doneQty === item.qty) {
                await this.syncJobsOnCompletion(itemId);
            }
        }
        return this.findOne(orderId);
    }
    async updateStatus(id, updateStatusDto) {
        const { status, notes } = updateStatusDto;
        const updateData = { status };
        if (notes !== undefined) {
            updateData.notes = notes;
        }
        await this.orderRepository.update(id, updateData);
        if (status === enums_1.OrderStatus.DONE) {
            await this.syncJobsOnCompletion(undefined, id);
        }
        return this.findOne(id);
    }
    async syncJobsOnCompletion(orderItemId, orderId) {
        const where = {};
        if (orderItemId)
            where.orderItemId = orderItemId;
        if (orderId)
            where.orderId = orderId;
        const activeJobs = await this.jobRepository.find({
            where: {
                ...where,
                status: (0, typeorm_2.In)([enums_1.JobStatus.QUEUED, enums_1.JobStatus.PRINTING, enums_1.JobStatus.PAUSED])
            }
        });
        for (const job of activeJobs) {
            await this.jobRepository.update(job.id, { status: enums_1.JobStatus.DONE });
            if (job.printerId) {
                await this.printerRepository.update(job.printerId, { status: enums_1.PrinterStatus.IDLE });
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map