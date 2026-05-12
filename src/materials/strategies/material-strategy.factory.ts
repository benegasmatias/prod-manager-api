import { Injectable, BadRequestException } from '@nestjs/common';
import { MaterialType } from '../../common/enums';
import { MaterialStrategy } from './material.strategy';
import { 
    FilamentMaterialStrategy, 
    BlankMaterialStrategy, 
    HardwareMaterialStrategy, 
    DefaultMaterialStrategy 
} from './concrete.strategies';

@Injectable()
export class MaterialStrategyFactory {
    private strategies: Map<string, MaterialStrategy> = new Map();

    constructor() {
        this.strategies.set(MaterialType.FILAMENT, new FilamentMaterialStrategy());
        this.strategies.set(MaterialType.BLANK, new BlankMaterialStrategy());
        this.strategies.set(MaterialType.HARDWARE, new HardwareMaterialStrategy());
        
        // Register legacy types to default strategy
        const legacyTypes = [
            MaterialType.PLA, MaterialType.PETG, MaterialType.ABS, 
            MaterialType.TPU, MaterialType.RESINA, MaterialType.INSUMO
        ];
        
        const defaultStrategy = new DefaultMaterialStrategy();
        legacyTypes.forEach(type => this.strategies.set(type, defaultStrategy));
    }

    getStrategy(type: string): MaterialStrategy {
        const strategy = this.strategies.get(type);
        if (!strategy) {
            // Fallback to default if it's an unknown legacy type or just use Default
            return new DefaultMaterialStrategy();
        }
        return strategy;
    }
}
