import { Injectable } from '@nestjs/common';
import { CreateOrderItemDto } from './dto/order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderFinancialService {
    /** 
     * Calcula el precio total de un conjunto de ítems.
     * Incluye lógica de precio base (qty * price) + extras de metadatos (diseño).
     */
    calculateItemsTotal(items: any[]): number {
        if (!items || items.length === 0) return 0;

        return items.reduce((acc, item) => {
            const basePrice = (Number(item.price) || 0) * (item.qty || 1);
            const designPrice = Number(item.metadata?.precioDiseno) || 0;
            return acc + basePrice + designPrice;
        }, 0);
    }

    /** 
     * Suma los adelantos/señas de los ítems de un pedido.
     */
    calculateTotalDeposits(items: OrderItem[]): number {
        if (!items) return 0;
        return items.reduce((acc, item) => acc + (Number(item.deposit) || 0), 0);
    }

    /** 
     * Suma los pagos registrados para el pedido.
     */
    calculateTotalPayments(order: Order): number {
        if (!order.payments) return 0;
        return order.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    }

    /** 
     * Calcula el saldo pendiente de un pedido.
     * Saldo = Total - (Señas + Pagos)
     */
    calculatePendingBalance(order: Order): number {
        const total = Number(order.totalPrice) || 0;
        const paid = this.calculateTotalDeposits(order.items) + this.calculateTotalPayments(order);
        
        return Math.max(0, total - paid);
    }
}
