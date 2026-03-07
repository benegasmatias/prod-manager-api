export declare class DashboardSummaryDto {
    totalSales: number;
    pendingBalance: number;
    activeOrders: number;
    productionOrders: number;
    activePrinters: number;
    newCustomers: number;
    recentOrders: RecentOrderDto[];
    alerts: DashboardAlertDto[];
    trends: {
        sales: number | null;
        orders: number | null;
        customers: number | null;
    } | null;
}
export declare class RecentOrderDto {
    id: string;
    clientName: string;
    total: number;
    status: string;
    dueDate: Date;
}
export declare class DashboardAlertDto {
    type: 'vencido' | 'proximo' | 'otro' | 'stock_bajo';
    message: string;
    metadata?: any;
}
