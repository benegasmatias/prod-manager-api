import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { RetailProduct } from '../entities/retail-product.entity';
import { RetailStockMovement } from '../entities/retail-stock-movement.entity';
import { RetailStockMovementType } from '../retail.enums';

@Injectable()
export class InventoryEngineService {
  constructor(
    @InjectRepository(RetailProduct)
    private readonly productRepository: Repository<RetailProduct>,
    @InjectRepository(RetailStockMovement)
    private readonly movementRepository: Repository<RetailStockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Ejecuta un ajuste de stock de forma atómica (LEDGER + SNAPSHOT).
   * Se puede pasar un EntityManager para participar en una transacción externa (ej: Venta).
   */
  async adjustStock(
    productId: string,
    amount: number,
    type: RetailStockMovementType,
    note?: string,
    existingManager?: EntityManager
  ): Promise<RetailStockMovement> {
    if (amount <= 0) {
      throw new BadRequestException('El monto del movimiento debe ser positivo');
    }

    const work = async (manager: EntityManager) => {
      // 1. Obtener producto con bloqueo para evitar race conditions en el snapshot
      const product = await manager.findOne(RetailProduct, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!product) throw new BadRequestException('Producto no encontrado');

      // 2. Determinar sentido y validar stock negativo en ventas/salidas
      const isReduction = [RetailStockMovementType.SALE, RetailStockMovementType.INVENTORY_OUT].includes(type);
      const adjustment = isReduction ? -Number(amount) : Number(amount);
      const newStock = Number(product.stock) + adjustment;

      if (isReduction && newStock < 0) {
        throw new BadRequestException(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
      }

      // 3. Crear movimiento en Ledger
      const movement = manager.create(RetailStockMovement, {
        productId,
        amount,
        type,
        note,
      });
      const savedMovement = await manager.save(RetailStockMovement, movement);

      // 4. Actualizar Snapshot en el producto
      await manager.update(RetailProduct, productId, { stock: newStock });

      return savedMovement;
    };

    if (existingManager) {
      return work(existingManager);
    } else {
      return this.dataSource.transaction(work);
    }
  }
}
