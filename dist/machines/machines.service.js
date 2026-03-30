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
exports.MachinesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const machine_entity_1 = require("./entities/machine.entity");
const enums_1 = require("../common/enums");
const orders_service_1 = require("../orders/orders.service");
const jobs_service_1 = require("../jobs/jobs.service");
let MachinesService = class MachinesService {
    constructor(machineRepository, ordersService, jobsService) {
        this.machineRepository = machineRepository;
        this.ordersService = ordersService;
        this.jobsService = jobsService;
    }
    async assignOrder(machineId, orderId, materialId, businessId, metadata) {
        const machine = await this.findOne(machineId, businessId);
        const order = await this.ordersService.findOne(orderId);
        if (!order.items || order.items.length === 0) {
            throw new common_1.NotFoundException('El pedido no tiene ítems para producir');
        }
        if (order.jobs && order.jobs.length > 0) {
            const activeJobs = order.jobs.filter(j => j.machineId &&
                [enums_1.JobStatus.QUEUED, enums_1.JobStatus.PRINTING, enums_1.JobStatus.PAUSED].includes(j.status));
            for (const job of activeJobs) {
                if (job.machineId !== machineId) {
                    await this.machineRepository.update(job.machineId, { status: enums_1.MachineStatus.IDLE });
                    await this.jobsService.updateStatus(job.id, enums_1.JobStatus.CANCELLED, 'Pedido movido a otra impresora');
                }
                else {
                    await this.jobsService.updateStatus(job.id, enums_1.JobStatus.CANCELLED, 'Re-asignación en la misma máquina');
                }
            }
        }
        await this.machineRepository.update(machineId, { status: enums_1.MachineStatus.PRINTING });
        if (order.status !== enums_1.OrderStatus.IN_PROGRESS) {
            await this.ordersService.updateStatus(orderId, { status: enums_1.OrderStatus.IN_PROGRESS });
        }
        const firstItem = order.items[0];
        await this.jobsService.create({
            orderId: order.id,
            orderItemId: firstItem.id,
            machineId: machineId,
            materialId: materialId,
            metadata: metadata,
            totalUnits: firstItem.qty,
            title: `Prod: ${order.code || 'S/N'} - ${firstItem.name}`
        });
        return this.findOne(machineId, businessId);
    }
    async release(machineId, businessId) {
        await this.findOne(machineId, businessId);
        const jobs = await this.jobsService.getQueue();
        const printerJobs = jobs.filter(j => j.machineId === machineId);
        for (const job of printerJobs) {
            await this.jobsService.updateStatus(job.id, enums_1.JobStatus.DONE, 'Liberado mediante gestión de unidades de producción');
        }
        await this.machineRepository.update(machineId, { status: enums_1.MachineStatus.IDLE });
        return this.findOne(machineId, businessId);
    }
    async create(createDto) {
        const machine = this.machineRepository.create(createDto);
        return this.machineRepository.save(machine);
    }
    async findAll(businessId, onlyActive = true, page = 1, pageSize = 50) {
        const where = {};
        if (businessId)
            where.businessId = businessId;
        if (onlyActive)
            where.active = true;
        const [data, total] = await this.machineRepository.findAndCount({
            where,
            order: { name: 'ASC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        });
        return { data, total };
    }
    async findOne(id, businessId) {
        const where = { id };
        if (businessId)
            where.businessId = businessId;
        const machine = await this.machineRepository.findOne({
            where,
            relations: ['productionJobs', 'productionJobs.order', 'productionJobs.orderItem', 'productionJobs.orderItem.product'],
            order: {
                productionJobs: {
                    createdAt: 'DESC'
                }
            }
        });
        if (!machine) {
            throw new common_1.NotFoundException(`Unidad de producción con ID ${id} no encontrada`);
        }
        return machine;
    }
    async update(id, updateDto, businessId) {
        await this.findOne(id, businessId);
        await this.machineRepository.update(id, updateDto);
        return this.findOne(id, businessId);
    }
    async updateStatus(id, status, businessId) {
        await this.findOne(id, businessId);
        await this.machineRepository.update(id, { status });
        return this.findOne(id, businessId);
    }
    async deactivate(id, businessId) {
        await this.findOne(id, businessId);
        await this.machineRepository.update(id, { active: false });
    }
};
exports.MachinesService = MachinesService;
exports.MachinesService = MachinesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        orders_service_1.OrdersService,
        jobs_service_1.JobsService])
], MachinesService);
//# sourceMappingURL=machines.service.js.map