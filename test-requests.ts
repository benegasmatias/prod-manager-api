import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CatalogRequestService } from './src/catalog-requests/services/catalog-request.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(CatalogRequestService);
  
  const businessId = '00a38fac-a26a-4e02-8269-4fb8bf89a6d6';
  const requests = await service.findAll(businessId);
  
  console.log(JSON.stringify(requests[0], null, 2));
  
  await app.close();
}

bootstrap();
