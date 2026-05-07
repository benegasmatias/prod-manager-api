import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Material } from './entities/material.entity';
import { MaterialMovement } from './entities/material-movement.entity';
import { CreateMaterialDto, UpdateMaterialDto, MaterialFormFieldSchema } from './dto/material.dto';
import { MaterialType } from '../common/enums';
import { MaterialStrategyFactory } from './strategies/material-strategy.factory';

@Injectable()
export class MaterialsService {
    constructor(
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        @InjectRepository(MaterialMovement)
        private readonly movementRepository: Repository<MaterialMovement>,
        private readonly strategyFactory: MaterialStrategyFactory,
    ) { }

    async create(createDto: CreateMaterialDto): Promise<Material> {
        // Resolve strategy for validation
        const strategy = this.strategyFactory.getStrategy(createDto.type);
        if (createDto.attributes) {
            strategy.validateAttributes(createDto.attributes);
        }

        const material = this.materialRepository.create({
            ...createDto,
            type: createDto.type as MaterialType,
            attributes: createDto.attributes || {},
        });
        const saved = await this.materialRepository.save(material);

        // Record initial stock if it's > 0 (using generic remainingWeightGrams for now as stock)
        const initialStock = saved.remainingWeightGrams || 0;
        if (initialStock > 0) {
            try {
                await this.recordMovement(saved, {
                    type: 'IN',
                    quantity: initialStock,
                    newValue: initialStock,
                    oldValue: 0,
                    notes: 'Stock inicial en creación',
                    createdBy: 'SYSTEM'
                });
            } catch (e) {
                console.error('⚠️ Error recording initial movement:', e.message);
            }
        }

        return saved;
    }

    async findOne(id: string): Promise<Material> {
        const material = await this.materialRepository.findOneBy({ id });
        if (!material) {
            throw new NotFoundException(`Material con ID ${id} no encontrado`);
        }
        
        // Fallback mapping: If attributes is empty, map legacy columns
        const strategy = this.strategyFactory.getStrategy(material.type);
        material.attributes = strategy.mapLegacyToAttributes(material);
        
        return material;
    }

    async findAll(businessId?: string, type?: string): Promise<Material[]> {
        const where: any = { active: true };
        if (businessId) where.businessId = businessId;
        
        if (type) {
            if (type === 'FILAMENT') {
                // For FILAMENT, we also want to include legacy 3D types
                where.type = In(['FILAMENT', 'PLA', 'PETG', 'ABS', 'TPU', 'RESINA']);
            } else {
                where.type = type;
            }
        }

        console.log('[MaterialsService] findAll where:', JSON.stringify(where));

        const materials = await this.materialRepository.find({
            where,
            order: { name: 'ASC' },
        });

        // Apply fallback mapping for all items
        return materials.map(m => {
            const strategy = this.strategyFactory.getStrategy(m.type);
            m.attributes = strategy.mapLegacyToAttributes(m);
            return m;
        });
    }

    async update(id: string, updateDto: UpdateMaterialDto): Promise<Material> {
        const current = await this.findOne(id);
        
        // Clean payload: businessId is only for guards context
        const { businessId, ...dataToUpdate } = updateDto;
        const updateData: Partial<Material> = { ...dataToUpdate as any };
        
        if (updateDto.type) updateData.type = updateDto.type as MaterialType;

        const strategy = this.strategyFactory.getStrategy(updateData.type || current.type);

        if (updateDto.attributes) {
            strategy.validateAttributes(updateDto.attributes);
            updateData.attributes = {
                ...(current.attributes || {}),
                ...updateDto.attributes
            };
        }

        const stockChanged = 
            updateDto.remainingWeightGrams !== undefined && 
            updateDto.remainingWeightGrams !== current.remainingWeightGrams;

        await this.materialRepository.update(id, updateData);
        const updated = await this.findOne(id);

        if (stockChanged) {
            try {
                const diff = (updated.remainingWeightGrams || 0) - (current.remainingWeightGrams || 0);
                await this.recordMovement(updated, {
                    type: diff > 0 ? 'IN' : (diff < 0 ? 'OUT' : 'ADJUSTMENT'),
                    quantity: Math.abs(diff),
                    oldValue: current.remainingWeightGrams,
                    newValue: updated.remainingWeightGrams,
                    notes: 'Actualización manual de stock',
                    createdBy: 'USER_MIGRATION' 
                });
            } catch (auditError) {
                console.error('⚠️ Error recording material movement (non-blocking):', auditError.message);
            }
        }

        return updated;
    }

    async deactivate(id: string): Promise<void> {
        await this.materialRepository.update(id, { active: false });
    }

    async getSchema(rubro: string): Promise<MaterialFormFieldSchema[]> {
        const baseFields: MaterialFormFieldSchema[] = [];

        if (rubro === 'IMPRESION_3D') {
            baseFields.push(
                { key: 'nozzleTemp', label: 'Temp. Nozzle (°C)', type: 'number', required: false, placeholder: 'Ej. 200' },
                { key: 'bedTemp', label: 'Temp. Cama (°C)', type: 'number', required: false, placeholder: 'Ej. 60' }
            );
        }

        if (rubro === 'METALURGICA') {
            baseFields.push(
                { key: 'thickness', label: 'Espesor (mm)', type: 'number', required: false, placeholder: 'Ej. 2.5' },
                { key: 'density', label: 'Densidad (g/cm³)', type: 'number', required: false }
            );
        }

        return baseFields;
    }

    private async recordMovement(
        material: Material, 
        data: { 
            type: string, 
            quantity: number, 
            oldValue: number, 
            newValue: number, 
            notes: string, 
            createdBy: string 
        }
    ) {
        const movement = this.movementRepository.create({
            materialId: material.id,
            businessId: material.businessId,
            type: data.type,
            quantity: data.quantity,
            oldValue: data.oldValue,
            newValue: data.newValue,
            unit: material.unit,
            notes: data.notes,
            createdBy: data.createdBy,
            referenceType: 'MANUAL'
        });
        return this.movementRepository.save(movement);
    }
}
