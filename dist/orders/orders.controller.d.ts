import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateProgressDto, FindOrdersDto, FindVisitsDto, FindQuotationsDto } from './dto/order.dto';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getSummary(businessId: string): Promise<import("./dto/order.dto").OrderSummaryResponseDto>;
    getBudgetSummary(businessId: string): Promise<import("./dto/order.dto").BudgetSummaryResponseDto>;
    findListing(query: FindOrdersDto): Promise<{
        data: import("./entities/order.entity").Order[];
        total: number;
    }>;
    findVisits(query: FindVisitsDto): Promise<{
        data: import("./entities/order.entity").Order[];
        total: number;
    }>;
    findQuotations(query: FindQuotationsDto): Promise<{
        data: import("./entities/order.entity").Order[];
        total: number;
    }>;
    findAll(query: FindOrdersDto): Promise<{
        data: import("./entities/order.entity").Order[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./entities/order.entity").Order>;
    create(createOrderDto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    reportFailure(id: string, reportFailureDto: import('./dto/order.dto').ReportFailureDto, req: any): Promise<import("./entities/order.entity").Order>;
    addPayment(id: string, createPaymentDto: CreatePaymentDto): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, req: any): Promise<import("./entities/order.entity").Order>;
    updateProgress(orderId: string, itemId: string, updateProgressDto: UpdateProgressDto, req: any): Promise<import("./entities/order.entity").Order>;
}
