import { OrderBusinessStrategy } from './order-strategy.interface';
import { CreateOrderItemDto, ReportFailureDto } from '../dto/order.dto';
import { OrderStatus, ProductionJobStatus as JobStatus, OrderItemStatus } from '../../common/enums';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { EntityManager } from 'typeorm';
import { ProductionStageTemplate } from '../types/workflow.types';

export class GenericOrderStrategy implements OrderBusinessStrategy {
    getInitialStatus(items: CreateOrderItemDto[]): OrderStatus {
        return OrderStatus.PENDING;
    }

    getProductionStages(item: OrderItem, order: Order): ProductionStageTemplate[] {
        return []; // No auto-workflow
    }

    async onAfterCreate(order: Order, manager: EntityManager): Promise<void> {
        // No default behavior for post-creation
    }

    async handleProductionFailure(
        order: Order, 
        dto: ReportFailureDto, 
        manager: EntityManager, 
        userId: string
    ): Promise<OrderStatus> {
        // Actualizar estado del ítem si se proporcionó
        if (dto.itemId) {
            const status = dto.action === 'KEEP' ? OrderItemStatus.IN_PROGRESS : 
                          (dto.action === 'DISCARD' ? OrderItemStatus.CANCELLED : OrderItemStatus.PENDING);
            await manager.update(OrderItem, dto.itemId, { status });
        }
        
        return order.status;
    }

    async releaseResources(
        order: Order, 
        manager: EntityManager, 
        options: { itemId?: string, targetStatus: JobStatus }
    ): Promise<void> {
        // Por defecto no requiere liberación de recursos físicos
    }
}
