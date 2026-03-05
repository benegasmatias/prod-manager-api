"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const printer_entity_1 = require("./entities/printer.entity");
const printers_controller_1 = require("./printers.controller");
const printers_service_1 = require("./printers.service");
const orders_module_1 = require("../orders/orders.module");
const jobs_module_1 = require("../jobs/jobs.module");
let PrintersModule = class PrintersModule {
};
exports.PrintersModule = PrintersModule;
exports.PrintersModule = PrintersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([printer_entity_1.Printer]),
            orders_module_1.OrdersModule,
            jobs_module_1.JobsModule
        ],
        controllers: [printers_controller_1.PrintersController],
        providers: [printers_service_1.PrintersService],
        exports: [printers_service_1.PrintersService],
    })
], PrintersModule);
//# sourceMappingURL=printers.module.js.map