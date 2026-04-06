import { IndustryStrategy, DashboardContext } from './industry-strategy.interface';
export declare class Print3DIndustryStrategy implements IndustryStrategy {
    getOperationalCounters(context: DashboardContext): any;
    getPipelineSummary(context: DashboardContext): any;
    getCalendarEvents(context: DashboardContext): any;
}
