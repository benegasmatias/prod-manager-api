import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
export declare class MaterialsService {
    private readonly materialRepository;
    constructor(materialRepository: Repository<Material>);
    create(createDto: CreateMaterialDto): Promise<Material>;
    findAll(businessId?: string): Promise<Material[]>;
    findOne(id: string): Promise<Material>;
    update(id: string, updateDto: UpdateMaterialDto): Promise<Material>;
    deactivate(id: string): Promise<void>;
}
