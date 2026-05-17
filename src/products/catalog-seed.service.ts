import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';

@Injectable()
export class CatalogSeedService implements OnModuleInit {
    private readonly logger = new Logger(CatalogSeedService.name);

    private readonly presets = {
        'IMPRESION_3D': [
            { name: 'Repuestos y Mecánica', slug: 'repuestos-mecanica', icon: 'Settings', color: '#3b82f6', sortOrder: 1 },
            { name: 'Figuras y Coleccionables', slug: 'figuras-coleccionables', icon: 'Palette', color: '#8b5cf6', sortOrder: 2 },
            { name: 'Llaveros y Accesorios', slug: 'llaveros-accesorios', icon: 'Key', color: '#ec4899', sortOrder: 3 },
            { name: 'Hueforge y Litofanías', slug: 'hueforge-litofanias', icon: 'Image', color: '#10b981', sortOrder: 4 },
            { name: 'Articulados y Flexis', slug: 'articulados-flexis', icon: 'Zap', color: '#f59e0b', sortOrder: 5 },
            { name: 'Juguetes y Juegos', slug: 'juguetes-juegos', icon: 'Gamepad2', color: '#06b6d4', sortOrder: 6 },
            { name: 'Herramientas y Gadgets', slug: 'herramientas-gadgets', icon: 'Wrench', color: '#64748b', sortOrder: 7 },
            { name: 'Cosplay y Máscaras', slug: 'cosplay-mascaras', icon: 'Mask', color: '#ef4444', sortOrder: 8 },
            { name: 'Organizadores y Oficina', slug: 'organizadores-oficina', icon: 'FolderHeart', color: '#f43f5e', sortOrder: 9 },
            { name: 'Hogar y Decoración', slug: 'hogar-decoracion', icon: 'Home', color: '#a855f7', sortOrder: 10 }
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
        private readonly categoryRepository: Repository<ProductCategory>,
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(BusinessTemplate)
        private readonly templateRepository: Repository<BusinessTemplate>
    ) {}

    async onModuleInit() {
        try {
            const businesses = await this.businessRepository.find({ where: { category: 'IMPRESION_3D' } });
            for (const b of businesses) {
                this.logger.log(`[SEED] Auto-resetting and re-seeding categories for Impresion 3D business: ${b.name} (${b.id})`);
                await this.seedForBusiness(b.id, 'IMPRESION_3D', true);
            }
        } catch (e) {
            this.logger.error('Failed to auto-reset categories on startup:', e);
        }
    }

    async seedForBusiness(businessId: string, industry: string = 'GENERICO', force: boolean = false) {
        if (force) {
            this.logger.log(`Forcing categories seed reset for business ${businessId}`);
            // Soft or hard delete existing categories for this business to refresh them
            await this.categoryRepository.delete({ businessId });
        } else {
            const existingCount = await this.categoryRepository.count({ where: { businessId } });
            if (existingCount > 0) {
                this.logger.log(`Business ${businessId} already has categories. Skipping seed.`);
                return [];
            }
        }

        let categories: any[] = [];

        // 1. Try to find categories from the business template
        try {
            const business = await this.businessRepository.findOne({ where: { id: businessId } });
            if (business && business.category) {
                const template = await this.templateRepository.findOne({ where: { key: business.category } });
                if (template && template.config?.catalogCategories?.length > 0) {
                    this.logger.log(`Found template categories for ${business.category}: ${template.config.catalogCategories.length} items`);
                    categories = template.config.catalogCategories.map((name: string, index: number) => ({
                        name,
                        slug: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                        icon: 'Package',
                        color: '#3b82f6',
                        sortOrder: index + 1
                    }));
                }
            }
        } catch (e) {
            this.logger.error('Error fetching template categories:', e);
        }

        // 2. Fallback to hardcoded presets if no template categories found
        if (categories.length === 0) {
            this.logger.log(`Using fallback presets for industry: ${industry}`);
            categories = this.presets[industry] || this.presets['GENERICO'];
        }
        
        const toCreate = categories.map(cat => ({
            ...cat,
            businessId
        }));

        const saved = await this.categoryRepository.save(toCreate);
        this.logger.log(`Seeded ${saved.length} categories for business ${businessId}`);
        return saved;
    }
}
