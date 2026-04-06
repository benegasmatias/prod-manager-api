"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jobs_service_1 = require("./jobs.service");
const production_job_service_1 = require("./production-job.service");
const jobs_controller_1 = require("./jobs.controller");
const production_jobs_controller_1 = require("./production-jobs.controller");
const orders_module_1 = require("../orders/orders.module");
const production_job_entity_1 = require("./entities/production-job.entity");
const job_progress_entity_1 = require("./entities/job-progress.entity");
const job_status_history_entity_1 = require("../history/entities/job-status-history.entity");
const machine_entity_1 = require("../machines/entities/machine.entity");
const material_entity_1 = require("../materials/entities/material.entity");
const order_item_entity_1 = require("../orders/entities/order-item.entity");
const business_entity_1 = require("../businesses/entities/business.entity");
const business_template_entity_1 = require("../businesses/entities/business-template.entity");
const production_job_material_entity_1 = require("./entities/production-job-material.entity");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                production_job_entity_1.ProductionJob,
                job_progress_entity_1.JobProgress,
                job_status_history_entity_1.JobStatusHistory,
                machine_entity_1.Machine,
                material_entity_1.Material,
                order_item_entity_1.OrderItem,
                business_entity_1.Business,
                business_template_entity_1.BusinessTemplate,
                production_job_material_entity_1.ProductionJobMaterial
            ]),
            orders_module_1.OrdersModule,
        ],
        controllers: [jobs_controller_1.JobsController, production_jobs_controller_1.ProductionJobsController],
        providers: [jobs_service_1.JobsService, production_job_service_1.ProductionJobService],
        exports: [jobs_service_1.JobsService, production_job_service_1.ProductionJobService],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map