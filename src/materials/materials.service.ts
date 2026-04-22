import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { MaterialMovement } from './entities/material-movement.entity';
import { CreateMaterialDto, UpdateMaterialDto, MaterialFormFieldSchema } from './dto/material.dto';
import { MaterialType } from '../common/enums';

@Injectable()
export class MaterialsService {
    constructor(
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        @InjectRepository(MaterialMovement)
        private readonly movementRepository: Repository<MaterialMovement>,
    ) { }

    async create(createDto: CreateMaterialDto): Promise<Material> {
        const material = this.materialRepository.create({
            ...createDto,
            type: createDto.type as MaterialType,
        });
        const saved = await this.materialRepository.save(material);

        // Record initial stock if it's > 0
        if (saved.remainingWeightGrams > 0) {
            try {
                await this.recordMovement(saved, {
                    type: 'IN',
                    quantity: saved.remainingWeightGrams,
                    newValue: saved.remainingWeightGrams,
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

    async findAll(businessId?: string): Promise<Material[]> {
        const where = businessId ? { businessId, active: true } : { active: true };
        return this.materialRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Material> {
        const material = await this.materialRepository.findOneBy({ id });
        if (!material) {
            throw new NotFoundException(`Material con ID ${id} no encontrado`);
        }
        return material;
    }

    async update(id: string, updateDto: UpdateMaterialDto): Promise<Material> {
        const current = await this.findOne(id);
        
        // Clean payload: businessId is only for guards context
        const { businessId, ...dataToUpdate } = updateDto;
        const updateData: Partial<Material> = { ...dataToUpdate as any };
        
        if (updateDto.type) updateData.type = updateDto.type as MaterialType;

        if (updateDto.attributes) {
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
