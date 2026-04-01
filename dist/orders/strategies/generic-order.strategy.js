"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericOrderStrategy = void 0;
const enums_1 = require("../../common/enums");
class GenericOrderStrategy {
    getInitialStatus(items) {
        return enums_1.OrderStatus.PENDING;
    }
    getProductionStages(item, order) {
        return [];
    }
    async onAfterCreate(order, manager) {
    }
    async handleProductionFailure(order, dto, manager, userId) {
        return dto.moveToReprint ? enums_1.OrderStatus.REPRINT_PENDING : enums_1.OrderStatus.FAILED;
    }
    async releaseResources(order, manager, options) {
    }
}
exports.GenericOrderStrategy = GenericOrderStrategy;
//# sourceMappingURL=generic-order.strategy.js.map