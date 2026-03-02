import { OrdersService } from './orders.service';
import { CreateOrderDto, FilterOrderDto, UpdateOrderDto } from './dto/order.dto';
import { OrderStatus } from '../common/enums';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    findAll(filters: FilterOrderDto): Promise<{
        items: import("./entities/order.entity").Order[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: string, status: OrderStatus, notes?: string): Promise<import("./entities/order.entity").Order>;
    update(id: string, updateOrderDto: UpdateOrderDto): Promise<import("./entities/order.entity").Order>;
}
