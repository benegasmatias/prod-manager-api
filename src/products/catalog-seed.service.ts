import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';

@Injectable()
export class CatalogSeedService {
    private readonly logger = new Logger(CatalogSeedService.name);

    private readonly presets = {
        'IMPRESION_3D': [
            { name: 'Repuestos y Mecánica', slug: 'repuestos-mecanica', icon: 'Settings', color: '#3b82f6', sortOrder: 1 },
            { name: 'Figuras y Coleccionables', slug: 'figuras-coleccionables', icon: 'Palette', color: '#8b5cf6', sortOrder: 2 },
            { name: 'Prototipos Industriales', slug: 'prototipos-industriales', icon: 'Cpu', color: '#64748b', sortOrder: 3 },
            { name: 'Articulados y Flexis', slug: 'articulados-flexis', icon: 'Zap', color: '#f59e0b', sortOrder: 4 },
            { name: 'Hogar y Decoración', slug: 'hogar-decoracion', icon: 'Home', color: '#10b981', sortOrder: 5 }
        ],
        'CARPINTERIA': [
            { name: 'Muebles de Interior', slug: 'muebles-interior', icon: 'Armchair', color: '#92400e', sortOrder: 1 },
            { name: 'Exterior y Jardín', slug: 'exterior-jardin', icon: 'Trees', color: '#15803d', sortOrder: 2 },
            { name: 'Materia Prima / Cortes', slug: 'cortes-materia-prima', icon: 'Layers', color: '#78350f', sortOrder: 3 },
            { name: 'Accesorios y Herrajes', slug: 'herrajes', icon: 'Nut', color: '#475569', sortOrder: 4 }
        ],
        'SUBLIMACION': [
            { name: 'Tazas y Cerámica', slug: 'tazas-ceramica', icon: 'Coffee', color: '#ec4899', sortOrder: 1 },
            { name: 'Textil (Remeras/Gorras)', slug: 'textil', icon: 'Shirt', color: '#3b82f6', sortOrder: 2 },
            { name: 'Regalos Personalizados', slug: 'regalos', icon: 'Gift', color: '#f59e0b', sortOrder: 3 }
        ],
        'GENERICO': [
            { name: 'Productos Terminados', slug: 'productos-terminados', icon: 'Package', color: '#3b82f6', sortOrder: 1 },
            { name: 'Servicios', slug: 'servicios', icon: 'Wrench', color: '#64748b', sortOrder: 2 },
            { name: 'Otros', slug: 'otros', icon: 'MoreHorizontal', color: '#94a3b8', sortOrder: 3 }
        ]
    };

    constructor(
        @InjectRepository(ProductCategory)
        private readonly categoryRepository: Repository<ProductCategory>
    ) {}

    async seedForBusiness(businessId: string, industry: string = 'GENERICO') {
        const categories = this.presets[industry] || this.presets['GENERICO'];
        
        const existingCount = await this.categoryRepository.count({ where: { businessId } });
        if (existingCount > 0) {
            this.logger.log(`Business ${businessId} already has categories. Skipping seed.`);
            return [];
        }

        const toCreate = categories.map(cat => ({
            ...cat,
            businessId
        }));

        const saved = await this.categoryRepository.save(toCreate);
        this.logger.log(`Seeded ${saved.length} categories for business ${businessId} (Industry: ${industry})`);
        return saved;
    }
}
