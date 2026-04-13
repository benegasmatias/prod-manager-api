import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { CashService } from './cash.service';
import { InventoryEngineService } from './inventory-engine.service';
import { RetailProductsService } from './retail-products.service';
import { ProcessSaleDto } from '../dto/sale.dto';
import { RetailStockMovementType } from '../retail.enums';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    private readonly cashService: CashService,
    private readonly inventoryEngine: InventoryEngineService,
    private readonly productsService: RetailProductsService,
    private readonly dataSource: DataSource,
  ) {}

  async processSale(businessId: string, dto: ProcessSaleDto): Promise<Sale> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Validar Caja Abierta
      const drawer = await this.cashService.getCurrentDrawer(businessId);
      if (!drawer) {
        throw new BadRequestException('No hay una caja abierta para realizar ventas');
      }

      // 2. Preparar ítems y calcular total
      let totalAmount = 0;
      const preparedItems = [];

      // Sorteamos por ID para prevenir deadlock en locks de stock
      const sortedItems = [...dto.items].sort((a, b) => a.productId.localeCompare(b.productId));

      for (const itemDto of sortedItems) {
        const product = await this.productsService.findOne(businessId, itemDto.productId);
        
        const priceAtSale = Number(product.salePrice);
        const itemTotal = priceAtSale * Number(itemDto.quantity);
        totalAmount += itemTotal;

        preparedItems.push({
          productId: product.id,
          quantity: itemDto.quantity,
          priceAtSale,
          totalAmount: itemTotal,
        });
      }

      // 3. Crear cabecera de Venta
      const sale = manager.create(Sale, {
        businessId,
        drawerId: drawer.id,
        totalAmount,
        paymentMethod: dto.paymentMethod,
      });
      const savedSale = await manager.save(Sale, sale);

      // 4. Procesar cada ítem (Stock + Detalle)
      for (const item of preparedItems) {
        // a. Registrar ítem
        const saleItem = manager.create(SaleItem, {
          saleId: savedSale.id,
          ...item
        });
        await manager.save(SaleItem, saleItem);

        // b. Descontar Stock (dentro de la misma tx)
        await this.inventoryEngine.adjustStock(
            item.productId, 
            item.quantity, 
            RetailStockMovementType.SALE, 
            `Venta #${savedSale.id.substring(0, 8)}`,
            manager
        );
      }

      // 5. Registrar ingreso en caja
      await this.cashService.registerSaleIncome(manager, drawer.id, totalAmount, savedSale.id);

      return savedSale;
    });
  }

  async findAll(businessId: string): Promise<Sale[]> {
    return this.saleRepository.find({
        where: { businessId },
        relations: ['items', 'items.product'],
        order: { createdAt: 'DESC' }
    });
  }
}
