import { OrderBusinessStrategy } from './order-strategy.interface';
import { CreateOrderItemDto, ReportFailureDto } from '../dto/order.dto';
import { OrderStatus, JobStatus } from '../../common/enums';
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
        // Comportamiento por defecto: seguir el flag del DTO
        return dto.moveToReprint ? OrderStatus.REPRINT_PENDING : OrderStatus.FAILED;
    }

    async releaseResources(
        order: Order, 
        manager: EntityManager, 
        options: { itemId?: string, targetStatus: JobStatus }
    ): Promise<void> {
        // Por defecto no requiere liberación de recursos físicos
    }
}
