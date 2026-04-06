import { Order } from '../../orders/entities/order.entity';
export interface DashboardContext {
    activeOrders: Order[];
    realOverdueCount: number;
    todayStr: string;
    nextWeekDate: Date;
}
export interface IndustryStrategy {
    getOperationalCounters(context: DashboardContext): any;
    getPipelineSummary(context: DashboardContext): any[];
    getCalendarEvents(context: DashboardContext): any[];
    validateOrderMetadata?(metadata: any): void;
}
