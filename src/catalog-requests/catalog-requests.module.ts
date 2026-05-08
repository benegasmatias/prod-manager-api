import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogOrderRequest } from './entities/catalog-order-request.entity';
import { CatalogOrderRequestItem } from './entities/catalog-order-request-item.entity';
import { PublicCatalogController } from './controllers/public-catalog.controller';
import { CatalogRequestAdminController } from './controllers/catalog-request-admin.controller';
import { PublicCatalogService } from './services/public-catalog.service';
import { CatalogRequestService } from './services/catalog-request.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CatalogOrderRequest, CatalogOrderRequestItem]),
    BusinessesModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
  ],
  controllers: [PublicCatalogController, CatalogRequestAdminController],
  providers: [PublicCatalogService, CatalogRequestService],
  exports: [CatalogRequestService],
})
export class CatalogRequestsModule {}
