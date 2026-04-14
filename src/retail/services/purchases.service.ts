import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase } from '../entities/purchase.entity';
import { PurchaseItem } from '../entities/purchase-item.entity';
import { Supplier } from '../entities/supplier.entity';
import { RetailProduct } from '../entities/retail-product.entity';
import { InventoryEngineService } from './inventory-engine.service';
import { RegisterPurchaseDto } from '../dto/purchase.dto';
import { RetailStockMovementType } from '../retail.enums';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(RetailProduct)
    private readonly productRepo: Repository<RetailProduct>,
    private readonly inventoryEngine: InventoryEngineService,
  ) {}

  async registerPurchase(businessId: string, dto: RegisterPurchaseDto, operatorId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La compra debe tener al menos un ítem');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Validate Supplier
      const supplier = await manager.findOne(Supplier, {
        where: { businessId, id: dto.supplierId, active: true }
      });
      if (!supplier) {
        throw new BadRequestException('Proveedor no encontrado o inactivo');
      }

      // 2. Recalculate Total and Validate Products
      let totalAmount = 0;
      const sortedItems = [...dto.items].sort((a, b) => a.productId.localeCompare(b.productId));
      
      const purchase = manager.create(Purchase, {
        businessId,
        supplierId: supplier.id,
        operatorId,
        totalAmount: 0, // Will update after loop
      });
      const savedPurchase = await manager.save(purchase);

      for (const itemDto of sortedItems) {
        // Find product with pessimistic lock to update cost and stock
        const product = await manager.findOne(RetailProduct, {
          where: { businessId, id: itemDto.productId },
          lock: { mode: 'pessimistic_write' }
        });

        if (!product) {
          throw new NotFoundException(`Producto no encontrado: ${itemDto.productId}`);
        }

        const itemTotal = Number(itemDto.quantity) * Number(itemDto.costPrice);
        totalAmount += itemTotal;

        // Create PurchaseItem
        const purchaseItem = manager.create(PurchaseItem, {
          purchaseId: savedPurchase.id,
          productId: product.id,
          quantity: itemDto.quantity,
          costPrice: itemDto.costPrice,
        });
        await manager.save(purchaseItem);

        // Update Product cost snapshot
        product.costPrice = itemDto.costPrice;
        await manager.save(product);

        // Atomic Stock Adjustment
        await this.inventoryEngine.adjustStock(
          product.id,
          itemDto.quantity,
          RetailStockMovementType.PURCHASE,
          `Compra a proveedor: ${supplier.name}`,
          manager
        );
      }

      // Finalize Purchase total
      savedPurchase.totalAmount = totalAmount;
      return manager.save(savedPurchase);
    });
  }
}
