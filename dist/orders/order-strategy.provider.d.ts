import { OrderBusinessStrategy } from './strategies/order-strategy.interface';
export declare class OrderStrategyProvider {
    private readonly genericStrategy;
    private readonly print3dStrategy;
    private readonly manufacturingStrategy;
    getStrategy(category: string): OrderBusinessStrategy;
}
