import { OrderBusinessStrategy } from './order-strategy.interface';
import { CreateOrderItemDto, ReportFailureDto } from '../dto/order.dto';
import { OrderStatus, JobStatus } from '../../common/enums';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { EntityManager } from 'typeorm';
import { ProductionStageTemplate } from '../types/workflow.types';

/**
 * Estrategia común para negocios de manufactura (Metalúrgica, Carpintería).
 */
export class ManufacturingOrderStrategy implements OrderBusinessStrategy {
    getInitialStatus(items: CreateOrderItemDto[]): OrderStatus {
        return OrderStatus.PENDING;
    }

    getProductionStages(item: OrderItem, order: Order): ProductionStageTemplate[] {
        const isVisitOrQuote = 
            order.status === OrderStatus.SITE_VISIT || 
            order.status === OrderStatus.SITE_VISIT_DONE || 
            order.status === OrderStatus.QUOTATION;

        if (isVisitOrQuote) return [];

        return [
            { title: 'Diseño / Preparación', rank: 10 },
            { title: 'Corte / Dimensionado', rank: 20 },
            { title: 'Soldadura / Unión', rank: 30 },
            { title: 'Armado / Ensamble', rank: 40 },
            { title: 'Pintura / Acabado', rank: 50 }
        ];
    }

    async onAfterCreate(order: Order, manager: EntityManager): Promise<void> {
    }

    async handleProductionFailure(
        order: Order, 
        dto: ReportFailureDto, 
        manager: EntityManager, 
        userId: string
    ): Promise<OrderStatus> {
        return dto.moveToReprint ? OrderStatus.REPRINT_PENDING : OrderStatus.FAILED;
    }

    async releaseResources(
        order: Order, 
        manager: EntityManager, 
        options: { itemId?: string, targetStatus: JobStatus }
    ): Promise<void> {
        // Manufactura no utiliza liberación automática de máquinas por ahora
    }
}
