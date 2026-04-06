"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderFinancialService = void 0;
const common_1 = require("@nestjs/common");
let OrderFinancialService = class OrderFinancialService {
    calculateItemsTotal(items) {
        if (!items || items.length === 0)
            return 0;
        return items.reduce((acc, item) => {
            const basePrice = (Number(item.price) || 0) * (item.qty || 1);
            const designPrice = Number(item.metadata?.precioDiseno) || 0;
            return acc + basePrice + designPrice;
        }, 0);
    }
    calculateTotalDeposits(items) {
        if (!items)
            return 0;
        return items.reduce((acc, item) => acc + (Number(item.deposit) || 0), 0);
    }
    calculateTotalPayments(order) {
        if (!order.payments)
            return 0;
        return order.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    }
    calculatePendingBalance(order) {
        const total = Number(order.totalPrice) || 0;
        const paid = this.calculateTotalDeposits(order.items) + this.calculateTotalPayments(order);
        return Math.max(0, total - paid);
    }
};
exports.OrderFinancialService = OrderFinancialService;
exports.OrderFinancialService = OrderFinancialService = __decorate([
    (0, common_1.Injectable)()
], OrderFinancialService);
//# sourceMappingURL=order-financial.service.js.map