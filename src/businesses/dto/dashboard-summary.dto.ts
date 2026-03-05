export class DashboardSummaryDto {
    totalSales: number;
    profit: number | null;
    activeOrders: number;
    newCustomers: number;
    recentOrders: RecentOrderDto[];
    alerts: DashboardAlertDto[];
    trends: {
        sales: number | null;
        profit: number | null;
        orders: number | null;
        customers: number | null;
    } | null;
}

export class RecentOrderDto {
    id: string;
    clientName: string;
    total: number;
    status: string;
    dueDate: Date;
}

export class DashboardAlertDto {
    type: 'vencido' | 'proximo' | 'otro';
    message: string;
    metadata?: any;
}
