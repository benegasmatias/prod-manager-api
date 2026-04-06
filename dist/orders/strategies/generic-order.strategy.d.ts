import { OrderBusinessStrategy } from './order-strategy.interface';
import { CreateOrderItemDto, ReportFailureDto } from '../dto/order.dto';
import { OrderStatus, JobStatus } from '../../common/enums';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { EntityManager } from 'typeorm';
import { ProductionStageTemplate } from '../types/workflow.types';
export declare class GenericOrderStrategy implements OrderBusinessStrategy {
    getInitialStatus(items: CreateOrderItemDto[]): OrderStatus;
    getProductionStages(item: OrderItem, order: Order): ProductionStageTemplate[];
    onAfterCreate(order: Order, manager: EntityManager): Promise<void>;
    handleProductionFailure(order: Order, dto: ReportFailureDto, manager: EntityManager, userId: string): Promise<OrderStatus>;
    releaseResources(order: Order, manager: EntityManager, options: {
        itemId?: string;
        targetStatus: JobStatus;
    }): Promise<void>;
}
