import { OrderBusinessStrategy } from './order-strategy.interface';
import { CreateOrderItemDto, ReportFailureDto } from '../dto/order.dto';
import { OrderStatus, ProductionJobStatus, MachineStatus, OrderItemStatus } from '../../common/enums';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { EntityManager, In } from 'typeorm';
import { ProductionStageTemplate } from '../types/workflow.types';
import { Material } from '../../materials/entities/material.entity';
import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { Machine } from '../../machines/entities/machine.entity';

/**
 * Estrategia específica para Impresión 3D.
 * Determina estados iniciales basados en si el item requiere diseño STL.
 */
export class Print3DOrderStrategy implements OrderBusinessStrategy {
    getInitialStatus(items: CreateOrderItemDto[]): OrderStatus {
        // Lógica migrada desde OrdersService:
        // Si algún item tiene el flag 'seDiseñaSTL', el pedido nace en DESIGN
        const needsDesign = items?.some(item => 
            item.metadata?.seDiseñaSTL === true || 
            item.metadata?.seDiseñaSTL === 'true'
        );
        
        return needsDesign ? OrderStatus.DESIGN : OrderStatus.PENDING;
    }

    getProductionStages(item: OrderItem, order: Order): ProductionStageTemplate[] {
        const needsDesign = item.metadata?.seDiseñaSTL === true || 
                           item.metadata?.seDiseñaSTL === 'true' ||
                           item.status === OrderItemStatus.DESIGN;

        if (needsDesign) {
            return [{ title: 'DESIGN', rank: 10 }];
        }

        return []; 
    }

    async onAfterCreate(order: Order, manager: EntityManager): Promise<void> {
        // En un futuro, aquí automatizamos el consumo de material 3D if any
    }

    async handleProductionFailure(
        order: Order, 
        dto: ReportFailureDto, 
        manager: EntityManager, 
        userId: string
    ): Promise<OrderStatus> {
        const { materialId, wastedGrams, metadata } = dto;
        const materialRepo = manager.getRepository(Material);

        // 1. Descontar material (Multi-filamento prioridad)
        if (metadata?.materials && Array.isArray(metadata.materials)) {
            for (const matSpec of metadata.materials) {
                const { materialId: matId, wastedGrams: wasted } = matSpec;
                if (!matId || !wasted) continue;

                const material = await materialRepo.findOneBy({ id: matId });
                if (material) {
                    const newRemaining = Math.max(0, material.remainingWeightGrams - wasted);
                    await materialRepo.update(material.id, { remainingWeightGrams: newRemaining });
                }
            }
        } else if (materialId && wastedGrams > 0) {
            // Fallback para material único
            const material = await materialRepo.findOneBy({ id: materialId });
            if (material) {
                const newRemaining = Math.max(0, material.remainingWeightGrams - wastedGrams);
                await materialRepo.update(material.id, { remainingWeightGrams: newRemaining });
            }
        }

        // 2. Actualizar estado del ÍTEM (si se pasó un itemId)
        if (dto.itemId) {
            const status = dto.action === 'KEEP' ? OrderItemStatus.IN_PROGRESS : 
                          (dto.action === 'DISCARD' ? OrderItemStatus.CANCELLED : OrderItemStatus.PENDING);
            
            await manager.update(OrderItem, dto.itemId, { status });

            // 3. Liberar recursos (Máquina/Trabajo)
            if (dto.action !== 'KEEP') {
                await this.releaseResources(order, manager, { 
                    itemId: dto.itemId, 
                    targetStatus: ProductionJobStatus.CANCELLED 
                });
            }
        }

        // 4. Retornar el estado actual del pedido para que OrdersService no lo pise con un valor incorrecto
        return order.status;
    }

    async releaseResources(
        order: Order, 
        manager: EntityManager, 
        options: { itemId?: string, targetStatus: ProductionJobStatus }
    ): Promise<void> {
        const { itemId, targetStatus } = options;
        const jobRepo = manager.getRepository(ProductionJob);
        const machineRepo = manager.getRepository(Machine);

        const where: any = { orderId: order.id };
        if (itemId) where.orderItemId = itemId;

        // Buscar trabajos activos que tengan una máquina asignada
        const activeJobs = await jobRepo.find({
            where: {
                ...where,
                status: In([ProductionJobStatus.QUEUED, ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.PAUSED])
            }
        });

        for (const job of activeJobs) {
            // Liberar máquina si el trabajo la tenía
            if (job.machineId) {
                await machineRepo.update(job.machineId, { status: MachineStatus.IDLE });
                console.log(`[Estrategia 3D] Impresora ${job.machineId} liberada.`);
            }
            // Actualizar estado del trabajo
            await jobRepo.update(job.id, { status: targetStatus as any });
        }
    }
}
