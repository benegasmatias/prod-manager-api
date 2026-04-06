import { Injectable } from '@nestjs/common';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderBusinessStrategy } from './strategies/order-strategy.interface';
import { EntityManager } from 'typeorm';
import { ProductionJobStatus, OrderStatus, OrderItemStatus } from '../common/enums';

@Injectable()
export class OrderWorkflowService {
    /** 
     * Orquesta la creación de trabajos de producción para un item 
     * delegando la definición de etapas a la estrategia del rubro.
     */
    async createWorkflow(
        order: Order, 
        item: OrderItem, 
        strategy: OrderBusinessStrategy, 
        manager: EntityManager
    ): Promise<void> {
        const stages = strategy.getProductionStages(item, order);
        
        if (!stages || stages.length === 0) return;

        const jobs = stages.map(s => manager.create(ProductionJob, {
            businessId: order.businessId,
            orderId: order.id,
            orderItemId: item.id,
            status: ProductionJobStatus.QUEUED,
            currentStage: s.title,
            sequence: s.rank || 0
        }));

        await manager.save(ProductionJob, jobs);
    }

    /**
     * Calcula y actualiza el estado del pedido basándose en el estado de sus items.
     * Regla de Agregación Etapa 6.1.
     */
    async aggregateOrderStatus(orderId: string, manager: EntityManager): Promise<OrderStatus> {
        const order = await manager.findOne(Order, { 
            where: { id: orderId },
            relations: ['items'] 
        });
        if (!order) return;

        const items = order.items;
        if (items.length === 0) return order.status;

        const statuses = items.map(i => i.status);
        let targetStatus: OrderStatus = order.status;

        // 1. Si todos están CANCELLED -> Order CANCELLED
        if (statuses.every(s => s === OrderItemStatus.CANCELLED)) {
            targetStatus = OrderStatus.CANCELLED;
        }
        // 2. Si todos están DONE -> Order DELIVERED (Damos por cerrada la entrega)
        else if (statuses.every(s => s === OrderItemStatus.DONE)) {
            targetStatus = OrderStatus.DELIVERED;
        }
        // 3. Si todos están READY (o DONE) -> Order READY (Lista para entregar)
        else if (statuses.every(s => s === OrderItemStatus.READY || s === OrderItemStatus.DONE)) {
            targetStatus = OrderStatus.READY;
        }
        // 4. Si hay alguno en IN_PROGRESS o FAILED -> Order IN_PROGRESS
        else if (statuses.some(s => s === OrderItemStatus.IN_PROGRESS || s === OrderItemStatus.FAILED || s === OrderItemStatus.READY)) {
            targetStatus = OrderStatus.IN_PROGRESS;
        }
        // 5. Por defecto mantelar el estado previo (ej: CONFIRMED) si todo es PENDING
        
        if (targetStatus !== order.status) {
            await manager.update(Order, orderId, { status: targetStatus });
            console.log(`[StatusAggregation] Order ${order.code} updated to ${targetStatus} based on Items.`);
        }

        return targetStatus;
    }
}
