import { IndustryStrategy, DashboardContext } from './industry-strategy.interface';
import { OrderStatus } from '../../common/enums';
export declare class MetalworkIndustryStrategy implements IndustryStrategy {
    getOperationalCounters(context: DashboardContext): {
        visitsToday: number;
        pendingBudgets: number;
        inProduction: number;
        deliveriesThisWeek: number;
        delayedOrders: number;
        pendingPayments: number;
    };
    getPipelineSummary(context: DashboardContext): {
        stage: string;
        count: number;
    }[];
    getCalendarEvents(context: DashboardContext): {
        id: string;
        type: string;
        clientName: string;
        date: string;
        time: string;
        status: OrderStatus;
    }[];
}
