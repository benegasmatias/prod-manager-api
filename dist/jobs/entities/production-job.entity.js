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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionJob = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("../../orders/entities/order.entity");
const order_item_entity_1 = require("../../orders/entities/order-item.entity");
const machine_entity_1 = require("../../machines/entities/machine.entity");
const employee_entity_1 = require("../../employees/entities/employee.entity");
const business_entity_1 = require("../../businesses/entities/business.entity");
const enums_1 = require("../../common/enums");
const production_job_material_entity_1 = require("./production-job-material.entity");
const typeorm_2 = require("typeorm");
const job_progress_entity_1 = require("./job-progress.entity");
const job_status_history_entity_1 = require("../../history/entities/job-status-history.entity");
let ProductionJob = class ProductionJob {
};
exports.ProductionJob = ProductionJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductionJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id' }),
    __metadata("design:type", String)
], ProductionJob.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => business_entity_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", business_entity_1.Business)
], ProductionJob.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id' }),
    __metadata("design:type", String)
], ProductionJob.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, (order) => order.jobs),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], ProductionJob.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_item_id', unique: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "orderItemId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => order_item_entity_1.OrderItem, (item) => item.productionJob, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_item_id' }),
    __metadata("design:type", order_item_entity_1.OrderItem)
], ProductionJob.prototype, "orderItem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'machine_id', nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "machineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => machine_entity_1.Machine, (machine) => machine.productionJobs, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'machine_id' }),
    __metadata("design:type", machine_entity_1.Machine)
], ProductionJob.prototype, "machine", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operator_id', nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'operator_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], ProductionJob.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.ProductionJobStatus,
        default: enums_1.ProductionJobStatus.QUEUED
    }),
    __metadata("design:type", String)
], ProductionJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.ProductionJobPriority,
        default: enums_1.ProductionJobPriority.NORMAL
    }),
    __metadata("design:type", String)
], ProductionJob.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_stage', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "currentStage", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ProductionJob.prototype, "sequence", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ProductionJob.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ProductionJob.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_started_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ProductionJob.prototype, "lastStartedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_minutes', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ProductionJob.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actual_minutes', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ProductionJob.prototype, "actualMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pause_reason', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "pauseReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_units', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], ProductionJob.prototype, "totalUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'material_id', nullable: true }),
    __metadata("design:type", String)
], ProductionJob.prototype, "materialId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Material', { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'material_id' }),
    __metadata("design:type", Object)
], ProductionJob.prototype, "material", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimated_weight_g_total', type: 'float', nullable: true }),
    __metadata("design:type", Number)
], ProductionJob.prototype, "estimatedWeightGTotal", void 0);
__decorate([
    (0, typeorm_2.OneToMany)(() => job_progress_entity_1.JobProgress, (p) => p.productionJob),
    __metadata("design:type", Array)
], ProductionJob.prototype, "progress", void 0);
__decorate([
    (0, typeorm_2.OneToMany)(() => job_status_history_entity_1.JobStatusHistory, (h) => h.productionJob),
    __metadata("design:type", Array)
], ProductionJob.prototype, "statusHistory", void 0);
__decorate([
    (0, typeorm_2.OneToMany)(() => production_job_material_entity_1.ProductionJobMaterial, (jm) => jm.job, { cascade: true }),
    __metadata("design:type", Array)
], ProductionJob.prototype, "jobMaterials", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ProductionJob.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProductionJob.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProductionJob.prototype, "updatedAt", void 0);
exports.ProductionJob = ProductionJob = __decorate([
    (0, typeorm_1.Entity)('production_jobs'),
    (0, typeorm_1.Index)(['businessId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['machineId']),
    (0, typeorm_1.Index)(['operatorId']),
    (0, typeorm_1.Unique)(['orderItemId'])
], ProductionJob);
//# sourceMappingURL=production-job.entity.js.map