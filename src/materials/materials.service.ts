import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { MaterialType } from '../common/enums';

@Injectable()
export class MaterialsService {
    constructor(
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
    ) { }

    async create(createDto: CreateMaterialDto): Promise<Material> {
        const material = this.materialRepository.create({
            ...createDto,
            type: createDto.type as MaterialType,
        });
        return this.materialRepository.save(material);
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
        const updateData: any = { ...updateDto };
        if (updateDto.type) updateData.type = updateDto.type as MaterialType;

        await this.materialRepository.update(id, updateData);
        return this.findOne(id);
    }

    async deactivate(id: string): Promise<void> {
        await this.materialRepository.update(id, { active: false });
    }
}
