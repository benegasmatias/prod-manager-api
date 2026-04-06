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
const order_entity_1 = require("./entities/order.entity");
const enums_1 = require("../common/enums");
let OrderWorkflowService = class OrderWorkflowService {
    async createWorkflow(order, item, strategy, manager) {
        const stages = strategy.getProductionStages(item, order);
        if (!stages || stages.length === 0)
            return;
        const jobs = stages.map(s => manager.create(production_job_entity_1.ProductionJob, {
            businessId: order.businessId,
            orderId: order.id,
            orderItemId: item.id,
            status: enums_1.ProductionJobStatus.QUEUED,
            currentStage: s.title,
            sequence: s.rank || 0
        }));
        await manager.save(production_job_entity_1.ProductionJob, jobs);
    }
    async aggregateOrderStatus(orderId, manager) {
        const order = await manager.findOne(order_entity_1.Order, {
            where: { id: orderId },
            relations: ['items']
        });
        if (!order)
            return;
        const items = order.items;
        if (items.length === 0)
            return order.status;
        const statuses = items.map(i => i.status);
        let targetStatus = order.status;
        if (statuses.every(s => s === enums_1.OrderItemStatus.CANCELLED)) {
            targetStatus = enums_1.OrderStatus.CANCELLED;
        }
        else if (statuses.every(s => s === enums_1.OrderItemStatus.DONE)) {
            targetStatus = enums_1.OrderStatus.DELIVERED;
        }
        else if (statuses.every(s => s === enums_1.OrderItemStatus.READY || s === enums_1.OrderItemStatus.DONE)) {
            targetStatus = enums_1.OrderStatus.READY;
        }
        else if (statuses.some(s => s === enums_1.OrderItemStatus.IN_PROGRESS || s === enums_1.OrderItemStatus.FAILED || s === enums_1.OrderItemStatus.READY)) {
            targetStatus = enums_1.OrderStatus.IN_PROGRESS;
        }
        if (targetStatus !== order.status) {
            await manager.update(order_entity_1.Order, orderId, { status: targetStatus });
            console.log(`[StatusAggregation] Order ${order.code} updated to ${targetStatus} based on Items.`);
        }
        return targetStatus;
    }
};
exports.OrderWorkflowService = OrderWorkflowService;
exports.OrderWorkflowService = OrderWorkflowService = __decorate([
    (0, common_1.Injectable)()
], OrderWorkflowService);
//# sourceMappingURL=order-workflow.service.js.map