import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { CreateOrderDto, FilterOrderDto, UpdateOrderDto } from './dto/order.dto';
import { OrderStatus } from '../common/enums';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly productRepository;
    private readonly statusHistoryRepository;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, productRepository: Repository<Product>, statusHistoryRepository: Repository<OrderStatusHistory>);
    create(createOrderDto: CreateOrderDto): Promise<Order>;
    findAll(filters: FilterOrderDto): Promise<{
        items: Order[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Order>;
    update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order>;
    updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order>;
    checkAndSetReadyStatus(id: string): Promise<void>;
    private derivePriority;
}
