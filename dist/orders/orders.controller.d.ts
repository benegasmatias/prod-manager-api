import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateProgressDto, FindOrdersDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    findAll(query: FindOrdersDto): Promise<import("./entities/order.entity").Order[]>;
    findOne(id: string): Promise<import("./entities/order.entity").Order>;
    create(createOrderDto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<import("./entities/order.entity").Order>;
    updateProgress(orderId: string, itemId: string, updateProgressDto: UpdateProgressDto): Promise<import("./entities/order.entity").Order>;
}
