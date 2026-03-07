import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSummary(businessId: string): Promise<{
        summary: {
            pendingOrders: number;
            activeJobs: number;
            monthlyTotal: number;
            averageMargin: number;
        };
        charts: {
            salesByMonth: {
                name: string;
                total: number;
            }[];
            productUsage: {
                name: string;
                value: number;
            }[];
        };
        printerStats: {
            name: string;
            jobsDone: number;
            efficiency: number;
        }[];
    }>;
}
