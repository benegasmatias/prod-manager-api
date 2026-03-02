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
const product_entity_1 = require("../products/entities/product.entity");
const order_status_history_entity_1 = require("../history/entities/order-status-history.entity");
const enums_1 = require("../common/enums");
let OrdersService = class OrdersService {
    orderRepository;
    orderItemRepository;
    productRepository;
    statusHistoryRepository;
    constructor(orderRepository, orderItemRepository, productRepository, statusHistoryRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }
    async create(createOrderDto) {
        const { customerId, dueDate, items } = createOrderDto;
        if (dueDate < new Date()) {
            throw new common_1.BadRequestException('Due date must be in the future');
        }
        const priority = this.derivePriority(dueDate);
        let totalPrice = 0;
        const order = this.orderRepository.create({
            customerId,
            dueDate,
            priority,
            status: enums_1.OrderStatus.DRAFT,
            totalPrice: 0,
        });
        const savedOrder = await this.orderRepository.save(order);
        for (const item of items) {
            const product = await this.productRepository.findOne({ where: { id: item.productId } });
            if (!product)
                throw new common_1.NotFoundException(`Product ${item.productId} not found`);
            const unitPrice = item.unitPrice ?? product.defaultPrice;
            const subtotal = unitPrice * item.quantity;
            totalPrice += subtotal;
            const orderItem = this.orderItemRepository.create({
                orderId: savedOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice,
                subtotal,
            });
            await this.orderItemRepository.save(orderItem);
        }
        savedOrder.totalPrice = totalPrice;
        await this.orderRepository.save(savedOrder);
        const history = this.statusHistoryRepository.create({
            orderId: savedOrder.id,
            toStatus: enums_1.OrderStatus.DRAFT,
            note: 'Initial creation',
        });
        await this.statusHistoryRepository.save(history);
        return this.findOne(savedOrder.id);
    }
    async findAll(filters) {
        const { status, fromDueDate, toDueDate, customerId, q, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const findOptions = {
            where: {},
            skip,
            take: limit,
            relations: ['customer'],
            order: { dueDate: 'ASC' },
        };
        if (status)
            findOptions.where.status = status;
        if (customerId)
            findOptions.where.customerId = customerId;
        if (fromDueDate && toDueDate) {
            findOptions.where.dueDate = (0, typeorm_2.Between)(fromDueDate, toDueDate);
        }
        else if (fromDueDate) {
            findOptions.where.dueDate = (0, typeorm_2.MoreThanOrEqual)(fromDueDate);
        }
        else if (toDueDate) {
            findOptions.where.dueDate = (0, typeorm_2.LessThanOrEqual)(toDueDate);
        }
        if (q) {
            findOptions.where = [
                { ...findOptions.where, customer: { fullName: (0, typeorm_2.ILike)(`%${q}%`) } },
                { ...findOptions.where, code: (0, typeorm_2.ILike)(`%${q}%`) },
            ];
        }
        const [items, total] = await this.orderRepository.findAndCount(findOptions);
        return { items, total, page, limit };
    }
    async findOne(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: [
                'items',
                'items.product',
                'jobs',
                'jobs.progress',
                'customer',
                'statusHistory',
                'payments',
            ],
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async update(id, updateOrderDto) {
        const currentOrder = await this.findOne(id);
        const { status, priority, dueDate } = updateOrderDto;
        const updateData = {};
        if (priority)
            updateData.priority = priority;
        if (dueDate)
            updateData.dueDate = dueDate;
        if (status && status !== currentOrder.status) {
            await this.updateStatus(id, status, 'Manual update');
        }
        if (Object.keys(updateData).length > 0) {
            await this.orderRepository.update(id, updateData);
        }
        return this.findOne(id);
    }
    async updateStatus(id, status, note) {
        const order = await this.findOne(id);
        const oldStatus = order.status;
        await this.orderRepository.update(id, { status });
        const history = this.statusHistoryRepository.create({
            orderId: id,
            fromStatus: oldStatus,
            toStatus: status,
            note,
        });
        await this.statusHistoryRepository.save(history);
        return this.findOne(id);
    }
    async checkAndSetReadyStatus(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['jobs'],
        });
        if (!order || !order.jobs || order.jobs.length === 0)
            return;
        const allJobsDone = order.jobs.every((job) => job.status === enums_1.JobStatus.DONE);
        if (allJobsDone && order.status === enums_1.OrderStatus.IN_PROGRESS) {
            await this.updateStatus(id, enums_1.OrderStatus.READY, 'All production jobs completed.');
        }
    }
    derivePriority(dueDate) {
        const now = new Date();
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours <= 24)
            return enums_1.Priority.URGENT;
        if (diffHours <= 72)
            return enums_1.Priority.HIGH;
        if (diffHours <= 7 * 24)
            return enums_1.Priority.NORMAL;
        return enums_1.Priority.LOW;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(order_status_history_entity_1.OrderStatusHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map