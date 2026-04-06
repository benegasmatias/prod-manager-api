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
exports.ProductionJobsController = void 0;
const common_1 = require("@nestjs/common");
const production_job_service_1 = require("./production-job.service");
const production_job_dto_1 = require("./dto/production-job.dto");
const business_role_guard_1 = require("../businesses/guards/business-role.guard");
const require_business_role_decorator_1 = require("../businesses/decorators/require-business-role.decorator");
const enums_1 = require("../common/enums");
let ProductionJobsController = class ProductionJobsController {
    constructor(jobService) {
        this.jobService = jobService;
    }
    async createJobs(businessId, createDto) {
        return this.jobService.createJobsForOrder(businessId, createDto.orderId, createDto.itemIds);
    }
    async findAll(businessId, filters) {
        return this.jobService.findAll(businessId, filters);
    }
    async findOne(businessId, id) {
        return this.jobService.findOne(businessId, id);
    }
    async assign(businessId, id, assignDto) {
        return this.jobService.assignResources(businessId, id, assignDto);
    }
    async updatePriority(businessId, id, priorityDto) {
        return this.jobService.updatePriority(businessId, id, priorityDto.priority);
    }
    async updateStatus(businessId, id, statusDto) {
        return this.jobService.updateStatus(businessId, id, statusDto.status);
    }
    async updateStage(businessId, id, stageDto) {
        return this.jobService.updateStage(businessId, id, stageDto.stage);
    }
    async addMaterial(businessId, id, materialDto) {
        return this.jobService.assignMaterial(businessId, id, materialDto);
    }
};
exports.ProductionJobsController = ProductionJobsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, production_job_dto_1.CreateProductionJobsDto]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "createJobs", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES, enums_1.BusinessRole.OPERATOR, enums_1.BusinessRole.VIEWER),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.SALES, enums_1.BusinessRole.OPERATOR, enums_1.BusinessRole.VIEWER),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.OPERATOR),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, production_job_dto_1.AssignResourcesDto]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "assign", null);
__decorate([
    (0, common_1.Patch)(':id/priority'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, production_job_dto_1.UpdateJobPriorityDto]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "updatePriority", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.OPERATOR),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, production_job_dto_1.UpdateJobStatusDto]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/stage'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.OPERATOR),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, production_job_dto_1.UpdateJobStageDto]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Post)(':id/materials'),
    (0, require_business_role_decorator_1.RequireBusinessRole)(enums_1.BusinessRole.OWNER, enums_1.BusinessRole.BUSINESS_ADMIN, enums_1.BusinessRole.OPERATOR),
    __param(0, (0, common_1.Param)('businessId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, production_job_dto_1.AssignMaterialDto]),
    __metadata("design:returntype", Promise)
], ProductionJobsController.prototype, "addMaterial", null);
exports.ProductionJobsController = ProductionJobsController = __decorate([
    (0, common_1.Controller)('businesses/:businessId/production-jobs'),
    (0, common_1.UseGuards)(business_role_guard_1.BusinessRoleGuard),
    __metadata("design:paramtypes", [production_job_service_1.ProductionJobService])
], ProductionJobsController);
//# sourceMappingURL=production-jobs.controller.js.map