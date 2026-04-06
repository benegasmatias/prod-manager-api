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
exports.ProductionJobService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const production_job_entity_1 = require("./entities/production-job.entity");
const order_item_entity_1 = require("../orders/entities/order-item.entity");
const business_entity_1 = require("../businesses/entities/business.entity");
const business_template_entity_1 = require("../businesses/entities/business-template.entity");
const order_workflow_service_1 = require("../orders/order-workflow.service");
const enums_1 = require("../common/enums");
const production_job_material_entity_1 = require("./entities/production-job-material.entity");
const material_entity_1 = require("../materials/entities/material.entity");
let ProductionJobService = class ProductionJobService {
    constructor(jobRepository, itemRepository, businessRepository, templateRepository, jobMaterialRepository, materialRepository, workflowService, dataSource) {
        this.jobRepository = jobRepository;
        this.itemRepository = itemRepository;
        this.businessRepository = businessRepository;
        this.templateRepository = templateRepository;
        this.jobMaterialRepository = jobMaterialRepository;
        this.materialRepository = materialRepository;
        this.workflowService = workflowService;
        this.dataSource = dataSource;
    }
    async createJobsForOrder(businessId, orderId, itemIds) {
        const whereClause = { orderId };
        if (itemIds && itemIds.length > 0) {
            whereClause.id = (0, typeorm_2.In)(itemIds);
        }
        const items = await this.itemRepository.find({
            where: whereClause,
            relations: ['productionJob', 'order']
        });
        const inconsistentItems = items.filter(i => i.orderId !== orderId);
        if (inconsistentItems.length > 0) {
            throw new common_1.BadRequestException('Uno o más ítems no pertenecen a la orden especificada.');
        }
        const pendingItems = items.filter(item => !item.productionJob);
        if (pendingItems.length === 0)
            return [];
        const jobs = [];
        await this.dataSource.transaction(async (manager) => {
            for (const item of pendingItems) {
                const job = manager.create(production_job_entity_1.ProductionJob, {
                    businessId,
                    orderId,
                    orderItemId: item.id,
                    status: enums_1.ProductionJobStatus.QUEUED,
                    priority: enums_1.ProductionJobPriority.NORMAL,
                    estimatedMinutes: item.estimatedMinutes || 0,
                    sequence: 0,
                });
                jobs.push(await manager.save(job));
            }
        });
        return jobs;
    }
    async findAll(businessId, filters) {
        const query = this.jobRepository.createQueryBuilder('job')
            .leftJoinAndSelect('job.orderItem', 'item')
            .leftJoinAndSelect('job.machine', 'machine')
            .leftJoinAndSelect('job.operator', 'operator')
            .leftJoinAndSelect('job.order', 'order')
            .leftJoinAndSelect('order.customer', 'customer')
            .where('job.businessId = :businessId', { businessId });
        if (filters.status)
            query.andWhere('job.status = :status', { status: filters.status });
        if (filters.priority)
            query.andWhere('job.priority = :priority', { priority: filters.priority });
        if (filters.machineId)
            query.andWhere('job.machineId = :machineId', { machineId: filters.machineId });
        if (filters.operatorId)
            query.andWhere('job.operatorId = :operatorId', { operatorId: filters.operatorId });
        if (filters.orderId)
            query.andWhere('job.orderId = :orderId', { orderId: filters.orderId });
        query.orderBy('job.sequence', 'ASC').addOrderBy('job.createdAt', 'DESC');
        return query.getMany();
    }
    async findOne(businessId, id) {
        const job = await this.jobRepository.findOne({
            where: { id, businessId },
            relations: ['orderItem', 'machine', 'operator', 'order', 'jobMaterials', 'jobMaterials.material']
        });
        if (!job)
            throw new common_1.NotFoundException('Trabajo de producción no encontrado');
        return job;
    }
    async assignResources(businessId, id, data) {
        const job = await this.findOne(businessId, id);
        if (data.operatorId !== undefined)
            job.operatorId = data.operatorId;
        if (data.machineId !== undefined)
            job.machineId = data.machineId;
        return this.jobRepository.save(job);
    }
    async updatePriority(businessId, id, priority) {
        const job = await this.findOne(businessId, id);
        job.priority = priority;
        return this.jobRepository.save(job);
    }
    async updateStatus(businessId, id, status) {
        const job = await this.findOne(businessId, id);
        if (!this.canTransitionStatus(job.status, status)) {
            throw new common_1.BadRequestException(`Transición de estado inválida: de ${job.status} a ${status}`);
        }
        const oldStatus = job.status;
        job.status = status;
        const now = new Date();
        if (oldStatus === enums_1.ProductionJobStatus.IN_PROGRESS && job.lastStartedAt) {
            const diffInMs = now.getTime() - new Date(job.lastStartedAt).getTime();
            const diffInMins = Math.round(diffInMs / 60000);
            job.actualMinutes = (job.actualMinutes || 0) + Math.max(1, diffInMins);
            job.lastStartedAt = null;
        }
        if (status === enums_1.ProductionJobStatus.IN_PROGRESS) {
            job.lastStartedAt = now;
            if (!job.startedAt)
                job.startedAt = now;
        }
        if (status === enums_1.ProductionJobStatus.DONE) {
            job.completedAt = now;
            await this.consumeMaterials(job);
        }
        const saved = await this.jobRepository.save(job);
        await this.syncItemStatus(saved);
        return saved;
    }
    async updateStage(businessId, id, stage) {
        const job = await this.findOne(businessId, id);
        const business = await this.businessRepository.findOneBy({ id: businessId });
        const template = await this.templateRepository.findOneBy({ key: business.category });
        if (!template) {
            throw new common_1.ForbiddenException(`El negocio no tiene un rubro (template) configurado para fabricación.`);
        }
        const allowedStages = template.config?.stages || [];
        if (allowedStages.length === 0) {
            throw new common_1.BadRequestException(`El rubro "${business.category}" no tiene etapas de producción definidas.`);
        }
        if (!allowedStages.includes(stage)) {
            throw new common_1.BadRequestException(`La etapa "${stage}" no es válida para el rubro ${business.category}`);
        }
        job.currentStage = stage;
        return this.jobRepository.save(job);
    }
    canTransitionStatus(current, target) {
        if (current === target)
            return true;
        const transitions = {
            [enums_1.ProductionJobStatus.QUEUED]: [enums_1.ProductionJobStatus.IN_PROGRESS, enums_1.ProductionJobStatus.CANCELLED],
            [enums_1.ProductionJobStatus.IN_PROGRESS]: [enums_1.ProductionJobStatus.PAUSED, enums_1.ProductionJobStatus.DONE, enums_1.ProductionJobStatus.FAILED, enums_1.ProductionJobStatus.CANCELLED],
            [enums_1.ProductionJobStatus.PAUSED]: [enums_1.ProductionJobStatus.IN_PROGRESS, enums_1.ProductionJobStatus.CANCELLED],
            [enums_1.ProductionJobStatus.DONE]: [],
            [enums_1.ProductionJobStatus.FAILED]: [enums_1.ProductionJobStatus.QUEUED, enums_1.ProductionJobStatus.CANCELLED],
            [enums_1.ProductionJobStatus.CANCELLED]: [],
        };
        return transitions[current]?.includes(target) || false;
    }
    async syncItemStatus(job) {
        const item = await this.itemRepository.findOne({
            where: { id: job.orderItemId },
            relations: ['order']
        });
        if (!item)
            return;
        const statusMap = {
            [enums_1.ProductionJobStatus.QUEUED]: enums_1.OrderItemStatus.PENDING,
            [enums_1.ProductionJobStatus.IN_PROGRESS]: enums_1.OrderItemStatus.IN_PROGRESS,
            [enums_1.ProductionJobStatus.PAUSED]: enums_1.OrderItemStatus.IN_PROGRESS,
            [enums_1.ProductionJobStatus.DONE]: enums_1.OrderItemStatus.READY,
            [enums_1.ProductionJobStatus.FAILED]: enums_1.OrderItemStatus.FAILED,
            [enums_1.ProductionJobStatus.CANCELLED]: enums_1.OrderItemStatus.CANCELLED,
        };
        const targetStatus = statusMap[job.status];
        if (targetStatus && item.status !== targetStatus) {
            item.status = targetStatus;
            await this.itemRepository.save(item);
            await this.workflowService.aggregateOrderStatus(item.orderId, this.dataSource.manager);
            console.log(`[ProductionSync] Item ${item.id} -> ${targetStatus}. Order ${item.orderId} aggregated.`);
        }
    }
    async assignMaterial(businessId, jobId, data) {
        const job = await this.findOne(businessId, jobId);
        const material = await this.materialRepository.findOne({ where: { id: data.materialId, businessId } });
        if (!material)
            throw new common_1.NotFoundException('Material no encontrado');
        const jobMat = this.jobMaterialRepository.create({
            jobId,
            materialId: data.materialId,
            quantity: data.quantity,
            isReserved: true
        });
        await this.jobMaterialRepository.save(jobMat);
        return this.findOne(businessId, jobId);
    }
    async consumeMaterials(job) {
        if (!job.jobMaterials || job.jobMaterials.length === 0)
            return;
        await this.dataSource.transaction(async (manager) => {
            for (const jm of job.jobMaterials) {
                if (jm.consumedQuantity >= jm.quantity)
                    continue;
                const material = jm.material;
                const toConsume = jm.quantity - jm.consumedQuantity;
                material.remainingWeightGrams = Math.max(0, (material.remainingWeightGrams || 0) - toConsume);
                await manager.save(material);
                jm.consumedQuantity = jm.quantity;
                await manager.save(jm);
            }
        });
    }
};
exports.ProductionJobService = ProductionJobService;
exports.ProductionJobService = ProductionJobService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(business_entity_1.Business)),
    __param(3, (0, typeorm_1.InjectRepository)(business_template_entity_1.BusinessTemplate)),
    __param(4, (0, typeorm_1.InjectRepository)(production_job_material_entity_1.ProductionJobMaterial)),
    __param(5, (0, typeorm_1.InjectRepository)(material_entity_1.Material)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        order_workflow_service_1.OrderWorkflowService,
        typeorm_2.DataSource])
], ProductionJobService);
//# sourceMappingURL=production-job.service.js.map