"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const business_entity_1 = require("./entities/business.entity");
const business_membership_entity_1 = require("./entities/business-membership.entity");
const business_template_entity_1 = require("./entities/business-template.entity");
const user_entity_1 = require("../users/entities/user.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const printer_entity_1 = require("../printers/entities/printer.entity");
const businesses_service_1 = require("./businesses.service");
const businesses_controller_1 = require("./businesses.controller");
const business_templates_controller_1 = require("./business-templates.controller");
const material_entity_1 = require("../materials/entities/material.entity");
let BusinessesModule = class BusinessesModule {
};
exports.BusinessesModule = BusinessesModule;
exports.BusinessesModule = BusinessesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([business_entity_1.Business, business_membership_entity_1.BusinessMembership, user_entity_1.User, business_template_entity_1.BusinessTemplate, order_entity_1.Order, customer_entity_1.Customer, printer_entity_1.Printer, material_entity_1.Material])],
        controllers: [businesses_controller_1.BusinessesController, business_templates_controller_1.BusinessTemplatesController],
        providers: [businesses_service_1.BusinessesService],
        exports: [businesses_service_1.BusinessesService],
    })
], BusinessesModule);
//# sourceMappingURL=businesses.module.js.map