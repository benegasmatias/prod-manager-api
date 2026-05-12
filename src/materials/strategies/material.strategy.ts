import { Material } from '../entities/material.entity';
import { BadRequestException } from '@nestjs/common';

export interface MaterialStrategy {
    validateAttributes(attributes: Record<string, any>): void;
    calculateJobCost(material: Material, quantityUsed: number): number;
    /**
     * Map legacy columns to attributes if attributes are missing
     */
    mapLegacyToAttributes(material: Material): Record<string, any>;
}

export abstract class BaseMaterialStrategy implements MaterialStrategy {
    abstract validateAttributes(attributes: Record<string, any>): void;
    abstract calculateJobCost(material: Material, quantityUsed: number): number;

    mapLegacyToAttributes(material: Material): Record<string, any> {
        return material.attributes || {};
    }

    protected ensureRequired(attributes: Record<string, any>, fields: string[]) {
        for (const field of fields) {
            if (attributes[field] === undefined || attributes[field] === null || attributes[field] === '') {
                throw new BadRequestException(`El campo '${field}' es requerido para este tipo de material.`);
            }
        }
    }
}
