import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Printer } from '../printers/entities/printer.entity';
import { CreateOrderDto, UpdateProgressDto, UpdateOrderStatusDto, FindOrdersDto } from './dto/order.dto';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly jobRepository;
    private readonly printerRepository;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, jobRepository: Repository<ProductionJob>, printerRepository: Repository<Printer>);
    findAll(query: FindOrdersDto): Promise<Order[]>;
    findOne(id: string): Promise<Order>;
    create(createOrderDto: CreateOrderDto): Promise<Order>;
    updateProgress(orderId: string, itemId: string, updateProgressDto: UpdateProgressDto): Promise<Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order>;
    private syncJobsOnCompletion;
}
