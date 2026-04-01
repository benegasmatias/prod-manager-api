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
exports.OrderSiteInfo = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
let OrderSiteInfo = class OrderSiteInfo {
};
exports.OrderSiteInfo = OrderSiteInfo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], OrderSiteInfo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id' }),
    __metadata("design:type", String)
], OrderSiteInfo.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => order_entity_1.Order, (order) => order.siteInfo),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], OrderSiteInfo.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address', nullable: true }),
    __metadata("design:type", String)
], OrderSiteInfo.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'visit_date', nullable: true }),
    __metadata("design:type", String)
], OrderSiteInfo.prototype, "visitDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'visit_time', nullable: true }),
    __metadata("design:type", String)
], OrderSiteInfo.prototype, "visitTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'visit_observations', type: 'text', nullable: true }),
    __metadata("design:type", String)
], OrderSiteInfo.prototype, "visitObservations", void 0);
exports.OrderSiteInfo = OrderSiteInfo = __decorate([
    (0, typeorm_1.Entity)('order_site_info')
], OrderSiteInfo);
//# sourceMappingURL=order-site-info.entity.js.map