"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetalworkIndustryStrategy = void 0;
const enums_1 = require("../../common/enums");
class MetalworkIndustryStrategy {
    getOperationalCounters(context) {
        const PRODUCTION_STATUSES = [
            enums_1.OrderStatus.IN_PROGRESS, enums_1.OrderStatus.DESIGN, enums_1.OrderStatus.CUTTING,
            enums_1.OrderStatus.WELDING, enums_1.OrderStatus.ASSEMBLY, enums_1.OrderStatus.PAINTING,
            enums_1.OrderStatus.BARNIZADO, enums_1.OrderStatus.POST_PROCESS, enums_1.OrderStatus.RE_WORK,
            enums_1.OrderStatus.OFFICIAL_ORDER
        ];
        return {
            visitsToday: context.activeOrders.filter(o => (o.status === enums_1.OrderStatus.SITE_VISIT || o.status === enums_1.OrderStatus.SITE_VISIT_DONE) && o.siteInfo?.visitDate === context.todayStr).length,
            pendingBudgets: context.activeOrders.filter(o => o.status === enums_1.OrderStatus.QUOTATION || o.status === enums_1.OrderStatus.SURVEY_DESIGN || o.status === enums_1.OrderStatus.BUDGET_GENERATED).length,
            inProduction: context.activeOrders.filter(o => PRODUCTION_STATUSES.includes(o.status)).length,
            deliveriesThisWeek: context.activeOrders.filter(o => o.dueDate && o.dueDate <= context.nextWeekDate && o.status !== enums_1.OrderStatus.DONE).length,
            delayedOrders: context.realOverdueCount,
            pendingPayments: context.activeOrders.filter(o => {
                const total = Number(o.totalPrice) || 0;
                const dep = o.items?.reduce((a, i) => a + Number(i.deposit || 0), 0) || 0;
                const pay = o.payments?.reduce((a, p) => a + Number(p.amount || 0), 0) || 0;
                return (total - dep - pay) > 0;
            }).length
        };
    }
    getPipelineSummary(context) {
        const PRODUCTION_STATUSES = [
            enums_1.OrderStatus.IN_PROGRESS, enums_1.OrderStatus.DESIGN, enums_1.OrderStatus.CUTTING,
            enums_1.OrderStatus.WELDING, enums_1.OrderStatus.ASSEMBLY, enums_1.OrderStatus.PAINTING,
            enums_1.OrderStatus.BARNIZADO, enums_1.OrderStatus.POST_PROCESS, enums_1.OrderStatus.RE_WORK,
            enums_1.OrderStatus.OFFICIAL_ORDER
        ];
        const pipelineStages = [
            { stage: 'VISITA', statuses: [enums_1.OrderStatus.SITE_VISIT, enums_1.OrderStatus.VISITA_REPROGRAMADA, enums_1.OrderStatus.SITE_VISIT_DONE] },
            { stage: 'PRESUPUESTO', statuses: [enums_1.OrderStatus.QUOTATION, enums_1.OrderStatus.BUDGET_GENERATED, enums_1.OrderStatus.SURVEY_DESIGN] },
            { stage: 'APROBADO', statuses: [enums_1.OrderStatus.APPROVED, enums_1.OrderStatus.OFFICIAL_ORDER] },
            { stage: 'PRODUCCION', statuses: PRODUCTION_STATUSES },
            { stage: 'LISTO', statuses: [enums_1.OrderStatus.DONE, enums_1.OrderStatus.READY] },
            { stage: 'ENTREGADO', statuses: [enums_1.OrderStatus.DELIVERED] }
        ];
        return pipelineStages.map(s => ({
            stage: s.stage,
            count: context.activeOrders.filter(o => s.statuses.includes(o.status)).length
        }));
    }
    getCalendarEvents(context) {
        return context.activeOrders
            .filter(o => ((o.status === enums_1.OrderStatus.SITE_VISIT || o.status === enums_1.OrderStatus.SITE_VISIT_DONE) && o.siteInfo?.visitDate) ||
            (o.dueDate && [enums_1.OrderStatus.DONE, enums_1.OrderStatus.READY, enums_1.OrderStatus.INSTALACION_OBRA].includes(o.status)))
            .sort((a, b) => {
            const dateA = a.siteInfo?.visitDate || a.dueDate?.toISOString().split('T')[0] || '';
            const dateB = b.siteInfo?.visitDate || b.dueDate?.toISOString().split('T')[0] || '';
            return dateA.localeCompare(dateB);
        })
            .slice(0, 10)
            .map(o => ({
            id: o.id,
            type: (o.status === enums_1.OrderStatus.SITE_VISIT || o.status === enums_1.OrderStatus.SITE_VISIT_DONE) ? 'VISIT' : 'DELIVERY',
            clientName: o.clientName || 'Cliente',
            date: o.siteInfo?.visitDate || (o.dueDate ? o.dueDate.toISOString().split('T')[0] : ''),
            time: o.siteInfo?.visitTime,
            status: o.status
        }));
    }
}
exports.MetalworkIndustryStrategy = MetalworkIndustryStrategy;
//# sourceMappingURL=metalwork-industry.strategy.js.map