export class DashboardSummaryDto {
    totalSales: number;
    pendingBalance: number;
    activeOrders: number;
    productionOrders: number;
    activeMachines: number;
    newCustomers: number;
    recentOrders: RecentOrderDto[];
    alerts: DashboardAlertDto[];
    trends: {
        sales: number | null;
        orders: number | null;
        customers: number | null;
    } | null;

    // Operational fields for Rubros like Metalurgica
    operationalCounters?: {
        visitsToday: number;
        pendingBudgets: number;
        inProduction: number;
        deliveriesThisWeek: number;
        delayedOrders: number;
        pendingPayments: number;
    };
    pipelineSummary?: {
        stage: string;
        count: number;
    }[];
    calendarEvents?: {
        id: string;
        type: 'VISIT' | 'DELIVERY' | 'INSTALLATION';
        clientName: string;
        date: string;
        status: string;
        time?: string;
    }[];
}

export class RecentOrderDto {
    id: string;
    clientName: string;
    total: number;
    status: string;
    dueDate: Date;
    type?: string;
    vehicle?: any;
}

export class DashboardAlertDto {
    type: 'vencido' | 'proximo' | 'otro' | 'stock_bajo' | 'sin_material' | 'sin_responsable';
    message: string;
    metadata?: any;
}
