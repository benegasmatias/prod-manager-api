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
exports.Order = void 0;
const typeorm_1 = require("typeorm");
const customer_entity_1 = require("../../customers/entities/customer.entity");
const order_item_entity_1 = require("./order-item.entity");
const enums_1 = require("../../common/enums");
const production_job_entity_1 = require("../../jobs/entities/production-job.entity");
const order_status_history_entity_1 = require("../../history/entities/order-status-history.entity");
const payment_entity_1 = require("../../payments/entities/payment.entity");
const order_failure_entity_1 = require("./order-failure.entity");
const business_entity_1 = require("../../businesses/entities/business.entity");
const employee_entity_1 = require("../../employees/entities/employee.entity");
const order_site_info_entity_1 = require("./order-site-info.entity");
let Order = class Order {
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => business_entity_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", business_entity_1.Business)
], Order.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_date', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Order.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.OrderStatus,
        default: enums_1.OrderStatus.PENDING
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.OrderType,
        default: enums_1.OrderType.CUSTOMER
    }),
    __metadata("design:type", String)
], Order.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_item_entity_1.OrderItem, (item) => item.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_entity_1.Customer, (customer) => customer.orders),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", customer_entity_1.Customer)
], Order.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => production_job_entity_1.ProductionJob, (job) => job.order),
    __metadata("design:type", Array)
], Order.prototype, "jobs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_status_history_entity_1.OrderStatusHistory, (history) => history.order),
    __metadata("design:type", Array)
], Order.prototype, "statusHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_failure_entity_1.OrderFailure, (failure) => failure.order),
    __metadata("design:type", Array)
], Order.prototype, "failures", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.order),
    __metadata("design:type", Array)
], Order.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => order_site_info_entity_1.OrderSiteInfo, (si) => si.order, { cascade: true }),
    __metadata("design:type", order_site_info_entity_1.OrderSiteInfo)
], Order.prototype, "siteInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_price', type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "totalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_senias', type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true }),
    __metadata("design:type", Number)
], Order.prototype, "totalSenias", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responsable_general_id', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "responsableGeneralId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'responsable_general_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], Order.prototype, "responsableGeneral", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Order.prototype, "metadata", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Unique)(['code', 'businessId'])
], Order);
//# sourceMappingURL=order.entity.js.map