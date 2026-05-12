import { Material } from '../entities/material.entity';
import { BaseMaterialStrategy } from './material.strategy';

/**
 * Strategy for 3D Printing Filaments
 */
export class FilamentMaterialStrategy extends BaseMaterialStrategy {
    validateAttributes(attributes: Record<string, any>): void {
        this.ensureRequired(attributes, ['color']);
    }

    calculateJobCost(material: Material, gramsUsed: number): number {
        // costPerKg is legacy, in new arch we should use costPerUnit (per gram)
        const costPerGram = material.costPerKg ? material.costPerKg / 1000 : material.costPerKg || 0;
        return costPerGram * gramsUsed;
    }

    override mapLegacyToAttributes(material: Material): Record<string, any> {
        if (material.attributes && Object.keys(material.attributes).length > 0) {
            return material.attributes;
        }
        
        // Fallback for legacy 3D materials
        return {
            color: material.color || 'Desconocido',
            brand: material.brand,
            nozzleTemperature: material.nozzleTemperature,
            bedTemperature: material.bedTemperature,
            legacy: true
        };
    }
}

/**
 * Strategy for Sublimation Blanks / Consumables
 */
export class BlankMaterialStrategy extends BaseMaterialStrategy {
    validateAttributes(attributes: Record<string, any>): void {
        this.ensureRequired(attributes, ['material']); // e.g. Polymer, Ceramic
    }

    calculateJobCost(material: Material, unitsUsed: number): number {
        // For blanks, we usually count units. costPerUnit is the price of 1 blank.
        const costPerUnit = material.costPerKg || 0; // Using costPerKg as general cost field for now
        return costPerUnit * Math.ceil(unitsUsed);
    }
}

/**
 * Strategy for Hardware (Screws, tools, etc.)
 */
export class HardwareMaterialStrategy extends BaseMaterialStrategy {
    validateAttributes(attributes: Record<string, any>): void {
        // Minimal validation
    }

    calculateJobCost(material: Material, quantityUsed: number): number {
        const costPerUnit = material.costPerKg || 0;
        return costPerUnit * quantityUsed;
    }
}

/**
 * Fallback Strategy for legacy types (PLA, PETG, etc.)
 */
export class DefaultMaterialStrategy extends FilamentMaterialStrategy {
    // Reuses Filament logic for now as most legacy types are 3D
}
