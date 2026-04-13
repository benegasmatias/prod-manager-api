import { TypeOrmModule } from '@nestjs/typeorm';
import { CashDrawer } from './entities/cash-drawer.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { RetailProduct } from './entities/retail-product.entity';
import { RetailStockMovement } from './entities/retail-stock-movement.entity';
import { CashService } from './services/cash.service';
import { RetailProductsService } from './services/retail-products.service';
import { InventoryEngineService } from './services/inventory-engine.service';
import { RetailController } from './controllers/retail.controller';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashDrawer, 
      CashMovement, 
      RetailProduct, 
      RetailStockMovement
    ]),
    BusinessesModule,
  ],
  controllers: [RetailController],
  providers: [
    CashService, 
    RetailProductsService, 
    InventoryEngineService
  ],
  exports: [
    CashService, 
    RetailProductsService, 
    InventoryEngineService
  ],
})
