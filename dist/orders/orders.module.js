"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const orders_controller_1 = require("./orders.controller");
const orders_service_1 = require("./orders.service");
const order_strategy_provider_1 = require("./order-strategy.provider");
const order_workflow_service_1 = require("./order-workflow.service");
const order_financial_service_1 = require("./order-financial.service");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const order_failure_entity_1 = require("./entities/order-failure.entity");
const order_status_history_entity_1 = require("../history/entities/order-status-history.entity");
const order_site_info_entity_1 = require("./entities/order-site-info.entity");
const product_entity_1 = require("../products/entities/product.entity");
const production_job_entity_1 = require("../jobs/entities/production-job.entity");
const machine_entity_1 = require("../machines/entities/machine.entity");
const material_entity_1 = require("../materials/entities/material.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([
                order_entity_1.Order,
                order_item_entity_1.OrderItem,
                order_failure_entity_1.OrderFailure,
                order_status_history_entity_1.OrderStatusHistory,
                order_site_info_entity_1.OrderSiteInfo,
                product_entity_1.Product,
                production_job_entity_1.ProductionJob,
                machine_entity_1.Machine,
                material_entity_1.Material,
                payment_entity_1.Payment
            ])],
        controllers: [orders_controller_1.OrdersController],
        providers: [orders_service_1.OrdersService, order_strategy_provider_1.OrderStrategyProvider, order_workflow_service_1.OrderWorkflowService, order_financial_service_1.OrderFinancialService],
        exports: [orders_service_1.OrdersService, order_workflow_service_1.OrderWorkflowService, typeorm_1.TypeOrmModule],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map