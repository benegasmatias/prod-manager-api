"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStrategyProvider = void 0;
const common_1 = require("@nestjs/common");
const generic_order_strategy_1 = require("./strategies/generic-order.strategy");
const print3d_order_strategy_1 = require("./strategies/print3d-order.strategy");
const manufacturing_order_strategy_1 = require("./strategies/manufacturing-order.strategy");
let OrderStrategyProvider = class OrderStrategyProvider {
    constructor() {
        this.genericStrategy = new generic_order_strategy_1.GenericOrderStrategy();
        this.print3dStrategy = new print3d_order_strategy_1.Print3DOrderStrategy();
        this.manufacturingStrategy = new manufacturing_order_strategy_1.ManufacturingOrderStrategy();
    }
    getStrategy(category) {
        switch (category) {
            case 'IMPRESION_3D':
                return this.print3dStrategy;
            case 'METALURGICA':
            case 'CARPINTERIA':
                return this.manufacturingStrategy;
            default:
                return this.genericStrategy;
        }
    }
};
exports.OrderStrategyProvider = OrderStrategyProvider;
exports.OrderStrategyProvider = OrderStrategyProvider = __decorate([
    (0, common_1.Injectable)()
], OrderStrategyProvider);
//# sourceMappingURL=order-strategy.provider.js.map