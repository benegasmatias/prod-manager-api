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
exports.PrintersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const printer_entity_1 = require("./entities/printer.entity");
const enums_1 = require("../common/enums");
const orders_service_1 = require("../orders/orders.service");
const jobs_service_1 = require("../jobs/jobs.service");
let PrintersService = class PrintersService {
    constructor(printerRepository, ordersService, jobsService) {
        this.printerRepository = printerRepository;
        this.ordersService = ordersService;
        this.jobsService = jobsService;
    }
    async assignOrder(printerId, orderId, materialId, businessId) {
        const printer = await this.findOne(printerId, businessId);
        const order = await this.ordersService.findOne(orderId);
        if (!order.items || order.items.length === 0) {
            throw new common_1.NotFoundException('El pedido no tiene ítems para producir');
        }
        await this.printerRepository.update(printerId, { status: enums_1.PrinterStatus.PRINTING });
        if (order.status !== enums_1.OrderStatus.IN_PROGRESS) {
            await this.ordersService.updateStatus(orderId, { status: enums_1.OrderStatus.IN_PROGRESS });
        }
        const firstItem = order.items[0];
        await this.jobsService.create({
            orderId: order.id,
            orderItemId: firstItem.id,
            printerId: printerId,
            materialId: materialId,
            totalUnits: firstItem.qty,
            title: `Prod: ${order.code || 'S/N'} - ${firstItem.name}`
        });
        return this.findOne(printerId, businessId);
    }
    async release(printerId, businessId) {
        await this.findOne(printerId, businessId);
        const jobs = await this.jobsService.getQueue();
        const printerJobs = jobs.filter(j => j.printerId === printerId);
        for (const job of printerJobs) {
            await this.jobsService.updateStatus(job.id, enums_1.JobStatus.DONE, 'Liberado mediante gestión de unidades de producción');
        }
        await this.printerRepository.update(printerId, { status: enums_1.PrinterStatus.IDLE });
        return this.findOne(printerId, businessId);
    }
    async create(createDto) {
        const printer = this.printerRepository.create(createDto);
        return this.printerRepository.save(printer);
    }
    async findAll(businessId, onlyActive = true) {
        const where = {};
        if (businessId)
            where.businessId = businessId;
        if (onlyActive)
            where.active = true;
        return this.printerRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }
    async findOne(id, businessId) {
        const where = { id };
        if (businessId)
            where.businessId = businessId;
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
            throw new common_1.NotFoundException(`Unidad de producción con ID ${id} no encontrada`);
        }
        return printer;
    }
    async update(id, updateDto, businessId) {
        await this.findOne(id, businessId);
        await this.printerRepository.update(id, updateDto);
        return this.findOne(id, businessId);
    }
    async updateStatus(id, status, businessId) {
        await this.findOne(id, businessId);
        await this.printerRepository.update(id, { status });
        return this.findOne(id, businessId);
    }
    async deactivate(id, businessId) {
        await this.findOne(id, businessId);
        await this.printerRepository.update(id, { active: false });
    }
};
exports.PrintersService = PrintersService;
exports.PrintersService = PrintersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(printer_entity_1.Printer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        orders_service_1.OrdersService,
        jobs_service_1.JobsService])
], PrintersService);
//# sourceMappingURL=printers.service.js.map