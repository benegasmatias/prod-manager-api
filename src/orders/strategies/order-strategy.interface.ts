import { CreateOrderItemDto, ReportFailureDto } from '../dto/order.dto';
import { OrderStatus, ProductionJobStatus as JobStatus } from '../../common/enums';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { EntityManager } from 'typeorm';
import { ProductionStageTemplate } from '../types/workflow.types';

export interface OrderBusinessStrategy {
    /** 
     * Determina el estado inicial basado en los items del pedido.
     */
    getInitialStatus(items: CreateOrderItemDto[]): OrderStatus;

    /** 
     * Retorna las etapas de producción automáticas para un item.
     * Si no devuelve ninguna, no se creará el workflow de jobs.
     */
    getProductionStages(item: OrderItem, order: Order): ProductionStageTemplate[];

    /** 
     * Hook posterior a la creación del pedido para tareas específicas.
     * Útil para automatizar flujos iniciales (ej. crear jobs).
     */
    onAfterCreate(order: Order, manager: EntityManager): Promise<void>;

    /** 
     * Maneja el reporte de un fallo de producción.
     * Permite que el rubro aplique lógica (ej. descuento de materiales).
     * @returns El estado de destino sugerido por la estrategia.
     */
    handleProductionFailure(
        order: Order, 
        dto: ReportFailureDto, 
        manager: EntityManager, 
        userId: string
    ): Promise<OrderStatus>;

    /**
     * Libera recursos físicos (maquinaria, estaciones) asociados al pedido o ítem.
     */
    releaseResources(
        order: Order, 
        manager: EntityManager, 
        options: { itemId?: string, targetStatus: JobStatus }
    ): Promise<void>;
}
