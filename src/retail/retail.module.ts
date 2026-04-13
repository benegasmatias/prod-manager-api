import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashDrawer } from './entities/cash-drawer.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { RetailProduct } from './entities/retail-product.entity';
import { RetailStockMovement } from './entities/retail-stock-movement.entity';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CashService } from './services/cash.service';
import { RetailProductsService } from './services/retail-products.service';
import { InventoryEngineService } from './services/inventory-engine.service';
import { SalesService } from './services/sales.service';
import { RetailController } from './controllers/retail.controller';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashDrawer, 
      CashMovement, 
      RetailProduct, 
      RetailStockMovement,
      Sale,
      SaleItem
    ]),
    BusinessesModule,
  ],
  controllers: [RetailController],
  providers: [
    CashService, 
    RetailProductsService, 
    InventoryEngineService,
    SalesService
  ],
  exports: [
    CashService, 
    RetailProductsService, 
    InventoryEngineService,
    SalesService
  ],
})
export class RetailModule {}
