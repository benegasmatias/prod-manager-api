import { IndustryStrategy } from './industry-strategy.interface';
export declare class BusinessStrategyProvider {
    private readonly genericStrategy;
    private readonly metalworkStrategy;
    private readonly print3dStrategy;
    getStrategy(category: string): IndustryStrategy;
}
