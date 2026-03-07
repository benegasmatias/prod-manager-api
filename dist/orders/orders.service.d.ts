import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Printer } from '../printers/entities/printer.entity';
import { CreateOrderDto, UpdateProgressDto, UpdateOrderStatusDto, FindOrdersDto } from './dto/order.dto';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly jobRepository;
    private readonly printerRepository;
    private readonly statusHistoryRepository;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, jobRepository: Repository<ProductionJob>, printerRepository: Repository<Printer>, statusHistoryRepository: Repository<OrderStatusHistory>);
    findAll(query: FindOrdersDto): Promise<Order[]>;
    findOne(id: string): Promise<Order>;
    create(createOrderDto: CreateOrderDto): Promise<Order>;
    syncOrderItemProgress(orderItemId: string): Promise<void>;
    updateProgress(orderId: string, itemId: string, updateProgressDto: UpdateProgressDto, userId?: string): Promise<Order>;
    checkAndSetReadyStatus(orderId: string): Promise<void>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, userId?: string): Promise<Order>;
    private syncJobsOnCompletion;
}
