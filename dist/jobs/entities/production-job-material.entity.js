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
exports.ProductionJobMaterial = void 0;
const typeorm_1 = require("typeorm");
const production_job_entity_1 = require("./production-job.entity");
const material_entity_1 = require("../../materials/entities/material.entity");
let ProductionJobMaterial = class ProductionJobMaterial {
};
exports.ProductionJobMaterial = ProductionJobMaterial;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductionJobMaterial.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'job_id' }),
    __metadata("design:type", String)
], ProductionJobMaterial.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => production_job_entity_1.ProductionJob, (job) => job.jobMaterials, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'job_id' }),
    __metadata("design:type", production_job_entity_1.ProductionJob)
], ProductionJobMaterial.prototype, "job", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'material_id' }),
    __metadata("design:type", String)
], ProductionJobMaterial.prototype, "materialId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => material_entity_1.Material, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'material_id' }),
    __metadata("design:type", material_entity_1.Material)
], ProductionJobMaterial.prototype, "material", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ProductionJobMaterial.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consumed_quantity', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], ProductionJobMaterial.prototype, "consumedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_reserved', default: true }),
    __metadata("design:type", Boolean)
], ProductionJobMaterial.prototype, "isReserved", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProductionJobMaterial.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProductionJobMaterial.prototype, "updatedAt", void 0);
exports.ProductionJobMaterial = ProductionJobMaterial = __decorate([
    (0, typeorm_1.Entity)('production_job_materials')
], ProductionJobMaterial);
//# sourceMappingURL=production-job-material.entity.js.map