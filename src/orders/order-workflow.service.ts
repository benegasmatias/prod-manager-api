import { Injectable } from '@nestjs/common';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderBusinessStrategy } from './strategies/order-strategy.interface';
import { EntityManager } from 'typeorm';
import { JobStatus } from '../common/enums';

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
            orderId: order.id,
            orderItemId: item.id,
            title: s.title,
            totalUnits: item.qty || 1,
            status: JobStatus.QUEUED,
            sortRank: s.rank,
            responsableId: order.responsableGeneralId
        }));

        await manager.save(ProductionJob, jobs);
    }
}
