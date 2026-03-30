import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { JobStatus } from '../common/enums';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Machine } from '../machines/entities/machine.entity';
import { CreateOrderDto, UpdateProgressDto, UpdateOrderStatusDto, FindOrdersDto, ReportFailureDto, FindVisitsDto, FindQuotationsDto, OrderSummaryResponseDto, BudgetSummaryResponseDto } from './dto/order.dto';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { OrderFailure } from './entities/order-failure.entity';
import { Material } from '../materials/entities/material.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly jobRepository;
    private readonly machineRepository;
    private readonly statusHistoryRepository;
    private readonly orderFailureRepository;
    private readonly materialRepository;
    private readonly paymentRepository;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, jobRepository: Repository<ProductionJob>, machineRepository: Repository<Machine>, statusHistoryRepository: Repository<OrderStatusHistory>, orderFailureRepository: Repository<OrderFailure>, materialRepository: Repository<Material>, paymentRepository: Repository<Payment>);
    findAll(query: FindOrdersDto): Promise<{
        data: Order[];
        total: number;
    }>;
    findListing(query: FindOrdersDto): Promise<{
        data: Order[];
        total: number;
    }>;
    getSummaryStats(businessId: string): Promise<OrderSummaryResponseDto>;
    getBudgetSummaryStats(businessId: string): Promise<BudgetSummaryResponseDto>;
    findVisits(query: FindVisitsDto): Promise<{
        data: Order[];
        total: number;
    }>;
    findQuotations(query: FindQuotationsDto): Promise<{
        data: Order[];
        total: number;
    }>;
    findOne(id: string): Promise<Order>;
    create(createOrderDto: CreateOrderDto): Promise<Order>;
    syncOrderItemProgress(orderItemId: string): Promise<void>;
    updateProgress(orderId: string, itemId: string, updateProgressDto: UpdateProgressDto, userId?: string): Promise<Order>;
    checkAndSetReadyStatus(orderId: string): Promise<void>;
    reportFailure(id: string, reportFailureDto: ReportFailureDto, userId: string): Promise<Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId?: string): Promise<Order>;
    releaseMachinesForOrder(orderId: string, targetJobStatus?: JobStatus, orderItemId?: string): Promise<void>;
    addPayment(id: string, createPaymentDto: CreatePaymentDto): Promise<Order>;
}
