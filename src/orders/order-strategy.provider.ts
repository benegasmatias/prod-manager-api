import { Injectable } from '@nestjs/common';
import { OrderBusinessStrategy } from './strategies/order-strategy.interface';
import { GenericOrderStrategy } from './strategies/generic-order.strategy';
import { Print3DOrderStrategy } from './strategies/print3d-order.strategy';
import { ManufacturingOrderStrategy } from './strategies/manufacturing-order.strategy';

@Injectable()
export class OrderStrategyProvider {
    // Singleton instances
    private readonly genericStrategy = new GenericOrderStrategy();
    private readonly print3dStrategy = new Print3DOrderStrategy();
    private readonly manufacturingStrategy = new ManufacturingOrderStrategy();

    /** 
     * Resuelve la estrategia adecuada basada en la categoría del negocio.
     */
    getStrategy(category: string): OrderBusinessStrategy {
        switch (category) {
            case 'IMPRESION_3D':
                return this.print3dStrategy;
            case 'METALURGICA':
            case 'CARPINTERIA':
                return this.manufacturingStrategy;
            default:
                return this.genericStrategy;
        }
    }
}
