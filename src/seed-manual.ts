import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CatalogSeedService } from './products/catalog-seed.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedService = app.get(CatalogSeedService);
    
    const businessId = '00a38fac-a26a-4e02-8269-4fb8bf89a6d6';
    const industry = 'IMPRESION_3D';
    
    console.log(`Seeding categories for business ${businessId}...`);
    try {
        const result = await seedService.seedForBusiness(businessId, industry);
        console.log('Seed result:', result);
    } catch (error) {
        console.error('Error seeding categories:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
