"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderWorkflowService = void 0;
const common_1 = require("@nestjs/common");
const production_job_entity_1 = require("../jobs/entities/production-job.entity");
const enums_1 = require("../common/enums");
let OrderWorkflowService = class OrderWorkflowService {
    async createWorkflow(order, item, strategy, manager) {
        const stages = strategy.getProductionStages(item, order);
        if (!stages || stages.length === 0)
            return;
        const jobs = stages.map(s => manager.create(production_job_entity_1.ProductionJob, {
            orderId: order.id,
            orderItemId: item.id,
            title: s.title,
            totalUnits: item.qty || 1,
            status: enums_1.JobStatus.QUEUED,
            sortRank: s.rank,
            responsableId: order.responsableGeneralId
        }));
        await manager.save(production_job_entity_1.ProductionJob, jobs);
    }
};
exports.OrderWorkflowService = OrderWorkflowService;
exports.OrderWorkflowService = OrderWorkflowService = __decorate([
    (0, common_1.Injectable)()
], OrderWorkflowService);
//# sourceMappingURL=order-workflow.service.js.map