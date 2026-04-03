import { Order } from '../../orders/entities/order.entity';
import { OrderStatus } from '../../common/enums';

export interface DashboardContext {
  activeOrders: Order[];
  realOverdueCount: number;
  todayStr: string;
  nextWeekDate: Date;
}

export interface IndustryStrategy {
  /**
   * Genera los contadores operacionales específicos del rubro.
   */
  getOperationalCounters(context: DashboardContext): any;

  /**
   * Genera el resumen del pipeline (etapas y conteos) por rubro.
   */
  getPipelineSummary(context: DashboardContext): any[];

  /**
   * Obtiene los eventos de calendario relevantes (visitas, entregas).
   */
  getCalendarEvents(context: DashboardContext): any[];

  /**
   * Validación opcional de los metadatos de un ítem de pedido.
   * Útil para asegurar campos específicos según el rubro.
   */
  validateOrderMetadata?(metadata: any): void;
}
