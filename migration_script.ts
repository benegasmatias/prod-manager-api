import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BusinessesService } from './src/businesses/businesses.service';
import { Business } from './src/businesses/entities/business.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const businessRepo = app.get<Repository<Business>>(getRepositoryToken(Business));
  
  const businesses = await businessRepo.find();
  console.log(`Found ${businesses.length} businesses. Initializing capabilities...`);
  
  for (const b of businesses) {
    if (!b.capabilities || b.capabilities.length === 0) {
      // Default for existing production businesses
      b.capabilities = ['PRODUCTION_MANAGEMENT', 'INVENTORY_RAW', 'SALES_BASIC'];
      await businessRepo.save(b);
      console.log(`Updated business ${b.name} (${b.id}) with default capabilities.`);
    }
  }
  
  await app.close();
  console.log('Migration complete.');
}

bootstrap();
