"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturingOrderStrategy = void 0;
const enums_1 = require("../../common/enums");
class ManufacturingOrderStrategy {
    getInitialStatus(items) {
        return enums_1.OrderStatus.PENDING;
    }
    getProductionStages(item, order) {
        const isVisitOrQuote = order.status === enums_1.OrderStatus.SITE_VISIT ||
            order.status === enums_1.OrderStatus.SITE_VISIT_DONE ||
            order.status === enums_1.OrderStatus.QUOTATION;
        if (isVisitOrQuote)
            return [];
        return [
            { title: 'Diseño / Preparación', rank: 10 },
            { title: 'Corte / Dimensionado', rank: 20 },
            { title: 'Soldadura / Unión', rank: 30 },
            { title: 'Armado / Ensamble', rank: 40 },
            { title: 'Pintura / Acabado', rank: 50 }
        ];
    }
    async onAfterCreate(order, manager) {
    }
    async handleProductionFailure(order, dto, manager, userId) {
        return dto.moveToReprint ? enums_1.OrderStatus.REPRINT_PENDING : enums_1.OrderStatus.FAILED;
    }
    async releaseResources(order, manager, options) {
    }
}
exports.ManufacturingOrderStrategy = ManufacturingOrderStrategy;
//# sourceMappingURL=manufacturing-order.strategy.js.map