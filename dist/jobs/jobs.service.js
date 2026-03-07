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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const production_job_entity_1 = require("./entities/production-job.entity");
const job_progress_entity_1 = require("./entities/job-progress.entity");
const job_status_history_entity_1 = require("../history/entities/job-status-history.entity");
const orders_service_1 = require("../orders/orders.service");
const enums_1 = require("../common/enums");
const printer_entity_1 = require("../printers/entities/printer.entity");
const material_entity_1 = require("../materials/entities/material.entity");
let JobsService = class JobsService {
    constructor(jobRepository, progressRepository, statusHistoryRepository, printerRepository, materialRepository, ordersService) {
        this.jobRepository = jobRepository;
        this.progressRepository = progressRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.printerRepository = printerRepository;
        this.materialRepository = materialRepository;
        this.ordersService = ordersService;
    }
    async create(createJobDto, userId) {
        const job = this.jobRepository.create({
            ...createJobDto,
            status: enums_1.JobStatus.QUEUED,
        });
        const savedJob = await this.jobRepository.save(job);
        const history = this.statusHistoryRepository.create({
            productionJobId: savedJob.id,
            toStatus: enums_1.JobStatus.QUEUED,
            note: 'Initial queuing',
            performedById: userId
        });
        await this.statusHistoryRepository.save(history);
        const fullJob = await this.findOne(savedJob.id);
        const order = fullJob.order;
        if (order.status === enums_1.OrderStatus.DRAFT || order.status === enums_1.OrderStatus.CONFIRMED) {
            await this.ordersService.updateStatus(order.id, { status: enums_1.OrderStatus.IN_PROGRESS, notes: 'Production jobs started.' }, userId);
        }
        return fullJob;
    }
    async getQueue(businessId) {
        const where = {
            status: (0, typeorm_2.In)([enums_1.JobStatus.QUEUED, enums_1.JobStatus.PRINTING, enums_1.JobStatus.PAUSED]),
        };
        if (businessId) {
            where.order = { businessId };
        }
        return this.jobRepository.find({
            where,
            relations: ['order', 'orderItem', 'orderItem.product', 'printer', 'material', 'progress'],
            order: {
                order: { priority: 'DESC' },
                dueDate: 'ASC',
                sortRank: 'ASC',
            },
        });
    }
    async findOne(id) {
        const job = await this.jobRepository.findOne({
            where: { id },
            relations: [
                'order',
                'orderItem',
                'orderItem.product',
                'progress',
                'statusHistory',
                'material',
            ],
        });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
        return job;
    }
    async updateStatus(id, status, note, userId) {
        const job = await this.findOne(id);
        const oldStatus = job.status;
        await this.jobRepository.update(id, { status });
        const history = this.statusHistoryRepository.create({
            productionJobId: id,
            fromStatus: oldStatus,
            toStatus: status,
            note,
            performedById: userId
        });
        await this.statusHistoryRepository.save(history);
        if (status === enums_1.JobStatus.DONE) {
            if (job.printerId) {
                await this.printerRepository.update(job.printerId, { status: enums_1.PrinterStatus.IDLE });
            }
            const unitsReported = job.progress?.reduce((sum, p) => sum + p.unitsDone, 0) || 0;
            const unitsPending = Math.max(0, job.totalUnits - unitsReported);
            if (unitsPending > 0) {
                await this.deductMaterialWeight(job, unitsPending);
            }
            await this.ordersService.checkAndSetReadyStatus(job.orderId);
        }
        return this.findOne(id);
    }
    async update(id, updateJobDto, userId) {
        const { status, notes, ...data } = updateJobDto;
        if (status) {
            return this.updateStatus(id, status, notes, userId);
        }
        if (Object.keys(data).length > 0 || notes) {
            await this.jobRepository.update(id, { ...data, notes });
        }
        return this.findOne(id);
    }
    async addProgress(id, createProgressDto, userId) {
        const job = await this.findOne(id);
        const currentUnitsDone = job.progress.reduce((sum, p) => sum + p.unitsDone, 0);
        if (currentUnitsDone + createProgressDto.unitsDone > job.totalUnits) {
            throw new common_1.BadRequestException('Total completed units cannot exceed job requirements');
        }
        const progress = this.progressRepository.create({
            productionJobId: id,
            ...createProgressDto,
            performedById: userId
        });
        await this.progressRepository.save(progress);
        await this.deductMaterialWeight(job, createProgressDto.unitsDone);
        const updatedUnitsDone = currentUnitsDone + createProgressDto.unitsDone;
        if (job.orderItemId) {
            await this.ordersService.syncOrderItemProgress(job.orderItemId);
        }
        if (updatedUnitsDone === job.totalUnits) {
            await this.updateStatus(id, enums_1.JobStatus.DONE, 'Completion reported via progress update.');
        }
        return this.findOne(id);
    }
    async deductMaterialWeight(job, units) {
        if (!job.materialId || units <= 0)
            return;
        let weightPerUnit = 0;
        if (job.estimatedWeightGTotal) {
            weightPerUnit = job.estimatedWeightGTotal / job.totalUnits;
        }
        else if (job.orderItem?.weightGrams) {
            weightPerUnit = job.orderItem.weightGrams;
        }
        const weightToDeduct = weightPerUnit * units;
        if (weightToDeduct > 0) {
            const material = await this.materialRepository.findOneBy({ id: job.materialId });
            if (material) {
                const newRemaining = Math.max(0, material.remainingWeightGrams - weightToDeduct);
                await this.materialRepository.update(material.id, { remainingWeightGrams: newRemaining });
                console.log(`[Filamento] Descontados ${weightToDeduct.toFixed(2)}g del material ${material.name}. Restante: ${newRemaining.toFixed(2)}g`);
            }
        }
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __param(1, (0, typeorm_1.InjectRepository)(job_progress_entity_1.JobProgress)),
    __param(2, (0, typeorm_1.InjectRepository)(job_status_history_entity_1.JobStatusHistory)),
    __param(3, (0, typeorm_1.InjectRepository)(printer_entity_1.Printer)),
    __param(4, (0, typeorm_1.InjectRepository)(material_entity_1.Material)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        orders_service_1.OrdersService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map