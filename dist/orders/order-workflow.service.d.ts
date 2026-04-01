import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderBusinessStrategy } from './strategies/order-strategy.interface';
import { EntityManager } from 'typeorm';
export declare class OrderWorkflowService {
    createWorkflow(order: Order, item: OrderItem, strategy: OrderBusinessStrategy, manager: EntityManager): Promise<void>;
}
