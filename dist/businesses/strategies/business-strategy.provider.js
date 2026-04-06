"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessStrategyProvider = void 0;
const common_1 = require("@nestjs/common");
const generic_industry_strategy_1 = require("./generic-industry.strategy");
const metalwork_industry_strategy_1 = require("./metalwork-industry.strategy");
const print3d_industry_strategy_1 = require("./print3d-industry.strategy");
let BusinessStrategyProvider = class BusinessStrategyProvider {
    constructor() {
        this.genericStrategy = new generic_industry_strategy_1.GenericIndustryStrategy();
        this.metalworkStrategy = new metalwork_industry_strategy_1.MetalworkIndustryStrategy();
        this.print3dStrategy = new print3d_industry_strategy_1.Print3DIndustryStrategy();
    }
    getStrategy(category) {
        const rawCategory = (category || 'GENERICO').toUpperCase().trim();
        if (rawCategory === 'IMPRESION_3D') {
            return this.print3dStrategy;
        }
        if (rawCategory === 'METALURGICA') {
            return this.metalworkStrategy;
        }
        if (rawCategory === 'CARPINTERIA') {
            return this.metalworkStrategy;
        }
        return this.genericStrategy;
    }
};
exports.BusinessStrategyProvider = BusinessStrategyProvider;
exports.BusinessStrategyProvider = BusinessStrategyProvider = __decorate([
    (0, common_1.Injectable)()
], BusinessStrategyProvider);
//# sourceMappingURL=business-strategy.provider.js.map