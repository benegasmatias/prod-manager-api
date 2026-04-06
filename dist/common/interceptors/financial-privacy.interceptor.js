"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialPrivacyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const enums_1 = require("../enums");
let FinancialPrivacyInterceptor = class FinancialPrivacyInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const role = request.businessRole;
        const shouldHide = role === enums_1.BusinessRole.OPERATOR || role === enums_1.BusinessRole.VIEWER;
        return next.handle().pipe((0, operators_1.map)(data => {
            if (!shouldHide || !data)
                return data;
            return this.sanitize(data);
        }));
    }
    sanitize(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeItem(item));
        }
        return this.sanitizeItem(data);
    }
    sanitizeItem(item) {
        if (typeof item !== 'object' || item === null)
            return item;
        const sensitiveFields = ['totalAmount', 'paidAmount', 'balance', 'totalSales', 'pendingBalance', 'budgetTotal'];
        sensitiveFields.forEach(field => {
            if (field in item) {
                item[field] = null;
            }
        });
        if (item.items && Array.isArray(item.items)) {
            item.items = item.items.map(subItem => this.sanitizeOrderItem(subItem));
        }
        return item;
    }
    sanitizeOrderItem(orderItem) {
        if (typeof orderItem !== 'object' || orderItem === null)
            return orderItem;
        const sensitiveFields = ['unitPrice', 'lineTotal', 'costPerUnit', 'price'];
        sensitiveFields.forEach(field => {
            if (field in orderItem) {
                orderItem[field] = null;
            }
        });
        return orderItem;
    }
};
exports.FinancialPrivacyInterceptor = FinancialPrivacyInterceptor;
exports.FinancialPrivacyInterceptor = FinancialPrivacyInterceptor = __decorate([
    (0, common_1.Injectable)()
], FinancialPrivacyInterceptor);
//# sourceMappingURL=financial-privacy.interceptor.js.map