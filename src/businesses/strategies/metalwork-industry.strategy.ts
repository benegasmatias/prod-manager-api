import { IndustryStrategy, DashboardContext } from './industry-strategy.interface';
import { OrderStatus } from '../../common/enums';

export class MetalworkIndustryStrategy implements IndustryStrategy {
  getOperationalCounters(context: DashboardContext) {
    const PRODUCTION_STATUSES = [
      OrderStatus.IN_PROGRESS, OrderStatus.DESIGN, OrderStatus.CUTTING,
      OrderStatus.WELDING, OrderStatus.ASSEMBLY, OrderStatus.PAINTING,
      OrderStatus.BARNIZADO, OrderStatus.POST_PROCESS, OrderStatus.RE_WORK,
      OrderStatus.OFFICIAL_ORDER
    ];

    return {
      visitsToday: context.activeOrders.filter(o => (o.status === OrderStatus.SITE_VISIT || o.status === OrderStatus.SITE_VISIT_DONE) && o.siteInfo?.visitDate === context.todayStr).length,
      pendingBudgets: context.activeOrders.filter(o => o.status === OrderStatus.QUOTATION || o.status === OrderStatus.SURVEY_DESIGN || o.status === OrderStatus.BUDGET_GENERATED).length,
      inProduction: context.activeOrders.filter(o => PRODUCTION_STATUSES.includes(o.status)).length,
      deliveriesThisWeek: context.activeOrders.filter(o => o.dueDate && o.dueDate <= context.nextWeekDate && o.status !== OrderStatus.DONE).length,
      delayedOrders: context.realOverdueCount,
      pendingPayments: context.activeOrders.filter(o => {
          const total = Number(o.totalPrice) || 0;
          const dep = o.items?.reduce((a, i) => a + Number(i.deposit || 0), 0) || 0;
          const pay = o.payments?.reduce((a, p) => a + Number(p.amount || 0), 0) || 0;
          return (total - dep - pay) > 0;
      }).length
    };
  }

  getPipelineSummary(context: DashboardContext) {
    const PRODUCTION_STATUSES = [
        OrderStatus.IN_PROGRESS, OrderStatus.DESIGN, OrderStatus.CUTTING,
        OrderStatus.WELDING, OrderStatus.ASSEMBLY, OrderStatus.PAINTING,
        OrderStatus.BARNIZADO, OrderStatus.POST_PROCESS, OrderStatus.RE_WORK,
        OrderStatus.OFFICIAL_ORDER
    ];

    const pipelineStages = [
        { stage: 'VISITA', statuses: [OrderStatus.SITE_VISIT, OrderStatus.VISITA_REPROGRAMADA, OrderStatus.SITE_VISIT_DONE] },
        { stage: 'PRESUPUESTO', statuses: [OrderStatus.QUOTATION, OrderStatus.BUDGET_GENERATED, OrderStatus.SURVEY_DESIGN] },
        { stage: 'APROBADO', statuses: [OrderStatus.APPROVED, OrderStatus.OFFICIAL_ORDER] },
        { stage: 'PRODUCCION', statuses: PRODUCTION_STATUSES },
        { stage: 'LISTO', statuses: [OrderStatus.DONE, OrderStatus.READY] },
        { stage: 'ENTREGADO', statuses: [OrderStatus.DELIVERED] }
    ];

    return pipelineStages.map(s => ({
        stage: s.stage,
        count: context.activeOrders.filter(o => s.statuses.includes(o.status)).length
    }));
  }

  getCalendarEvents(context: DashboardContext) {
    return context.activeOrders
        .filter(o => 
            ((o.status === OrderStatus.SITE_VISIT || o.status === OrderStatus.SITE_VISIT_DONE) && o.siteInfo?.visitDate) || 
            (o.dueDate && [OrderStatus.DONE, OrderStatus.READY, OrderStatus.INSTALACION_OBRA].includes(o.status))
        )
        .sort((a, b) => {
            const dateA = a.siteInfo?.visitDate || a.dueDate?.toISOString().split('T')[0] || '';
            const dateB = b.siteInfo?.visitDate || b.dueDate?.toISOString().split('T')[0] || '';
            return dateA.localeCompare(dateB);
        })
        .slice(0, 10)
        .map(o => ({
            id: o.id,
            type: (o.status === OrderStatus.SITE_VISIT || o.status === OrderStatus.SITE_VISIT_DONE) ? 'VISIT' : 'DELIVERY',
            clientName: o.clientName || 'Cliente',
            date: o.siteInfo?.visitDate || (o.dueDate ? o.dueDate.toISOString().split('T')[0] : ''),
            time: o.siteInfo?.visitTime,
            status: o.status
        }));
  }
}
