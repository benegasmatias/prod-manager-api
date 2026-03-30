import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    create(createMaterialDto: CreateMaterialDto): Promise<import("./entities/material.entity").Material>;
    findAll(businessId?: string): Promise<import("./entities/material.entity").Material[]>;
    findOne(id: string): Promise<import("./entities/material.entity").Material>;
    update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<import("./entities/material.entity").Material>;
    remove(id: string): Promise<void>;
}
