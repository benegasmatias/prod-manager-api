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
exports.AssignMaterialDto = exports.UpdateJobStageDto = exports.UpdateJobPriorityDto = exports.UpdateJobStatusDto = exports.AssignResourcesDto = exports.CreateProductionJobsDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
class CreateProductionJobsDto {
}
exports.CreateProductionJobsDto = CreateProductionJobsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductionJobsDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateProductionJobsDto.prototype, "itemIds", void 0);
class AssignResourcesDto {
}
exports.AssignResourcesDto = AssignResourcesDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssignResourcesDto.prototype, "operatorId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AssignResourcesDto.prototype, "machineId", void 0);
class UpdateJobStatusDto {
}
exports.UpdateJobStatusDto = UpdateJobStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.ProductionJobStatus),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateJobStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateJobStatusDto.prototype, "pauseReason", void 0);
class UpdateJobPriorityDto {
}
exports.UpdateJobPriorityDto = UpdateJobPriorityDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.ProductionJobPriority),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateJobPriorityDto.prototype, "priority", void 0);
class UpdateJobStageDto {
}
exports.UpdateJobStageDto = UpdateJobStageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateJobStageDto.prototype, "stage", void 0);
class AssignMaterialDto {
}
exports.AssignMaterialDto = AssignMaterialDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignMaterialDto.prototype, "materialId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], AssignMaterialDto.prototype, "quantity", void 0);
//# sourceMappingURL=production-job.dto.js.map