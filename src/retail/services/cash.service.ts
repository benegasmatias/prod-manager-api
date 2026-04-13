import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CashDrawer } from '../entities/cash-drawer.entity';
import { CashMovement } from '../entities/cash-movement.entity';
import { CashDrawerStatus, CashMovementType } from '../retail.enums';
import { OpenDrawerDto, ManualMovementDto } from '../dto/cash.dto';

@Injectable()
export class CashService {
  constructor(
    @InjectRepository(CashDrawer)
    private readonly drawerRepository: Repository<CashDrawer>,
    @InjectRepository(CashMovement)
    private readonly movementRepository: Repository<CashMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async getCurrentDrawer(businessId: string): Promise<CashDrawer | null> {
    return this.drawerRepository.findOne({
      where: { businessId, status: CashDrawerStatus.OPEN },
      order: { openedAt: 'DESC' },
    });
  }

  async openDrawer(businessId: string, operatorId: string, dto: OpenDrawerDto): Promise<CashDrawer> {
    const active = await this.getCurrentDrawer(businessId);
    if (active) {
      throw new BadRequestException('Ya existe una caja abierta para este negocio');
    }

    const drawer = this.drawerRepository.create({
      businessId,
      operatorId,
      status: CashDrawerStatus.OPEN,
      openingBalance: dto.openingBalance,
      currentBalance: dto.openingBalance,
      openedAt: new Date(),
    });

    return this.drawerRepository.save(drawer);
  }

  async addManualMovement(businessId: string, operatorId: string, dto: ManualMovementDto): Promise<CashMovement> {
    const drawer = await this.getCurrentDrawer(businessId);
    if (!drawer) {
      throw new ForbiddenException('Debe abrir una caja antes de registrar movimientos');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('El monto debe ser positivo');
    }

    // El tipo de movimiento manual debe ser IN o OUT
    if (dto.type === CashMovementType.SALE_INCOME) {
        throw new BadRequestException('El tipo de movimiento SALE_INCOME es automático');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Crear el movimiento
      const movement = manager.create(CashMovement, {
        drawerId: drawer.id,
        amount: dto.amount,
        type: dto.type,
        operatorId,
        note: dto.note,
      });

      const savedMovement = await manager.save(CashMovement, movement);

      // 2. Actualizar el balance de la caja (SNAPSHOT)
      // Si es OUT, restamos. Si es IN, sumamos.
      const multiplier = dto.type === CashMovementType.MANUAL_OUT ? -1 : 1;
      const adjustment = Number(dto.amount) * multiplier;
      
      await manager.update(CashDrawer, drawer.id, {
        currentBalance: Number(drawer.currentBalance) + adjustment,
      });

      return savedMovement;
    });
  }

  async closeDrawer(businessId: string): Promise<CashDrawer> {
    const drawer = await this.getCurrentDrawer(businessId);
    if (!drawer) {
      throw new BadRequestException('No hay una caja abierta para cerrar');
    }

    drawer.status = CashDrawerStatus.CLOSED;
    drawer.closedAt = new Date();
    drawer.closingBalance = drawer.currentBalance;

    return this.drawerRepository.save(drawer);
  }
}
