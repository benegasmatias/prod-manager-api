import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RetailExpense } from '../entities/retail-expense.entity';
import { CashDrawer } from '../entities/cash-drawer.entity';
import { CashMovement } from '../entities/cash-movement.entity';
import { RetailExpenseCategory, CashMovementType } from '../retail.enums';

@Injectable()
export class RetailExpensesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(RetailExpense)
    private expenseRepo: Repository<RetailExpense>,
    @InjectRepository(CashDrawer)
    private drawerRepo: Repository<CashDrawer>,
  ) {}

  async registerExpense(
    businessId: string,
    operatorId: string,
    data: { amount: number; category: RetailExpenseCategory; note: string }
  ): Promise<RetailExpense> {
    if (data.amount <= 0) {
      throw new BadRequestException('El monto del gasto debe ser mayor a cero.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar caja abierta
      const drawer = await queryRunner.manager.findOne(CashDrawer, {
        where: { businessId, status: 'OPEN' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!drawer) {
        throw new BadRequestException('No hay una caja abierta para registrar el gasto.');
      }

      // 2. Crear Gasto
      const expense = this.expenseRepo.create({
        ...data,
        businessId,
        drawerId: drawer.id,
        operatorId,
      });
      const savedExpense = await queryRunner.manager.save(expense);

      // 3. Crear Movimiento de Caja
      const movement = queryRunner.manager.create(CashMovement, {
        businessId,
        drawerId: drawer.id,
        type: CashMovementType.MANUAL_OUT,
        amount: data.amount,
        note: `GASTO [${data.category}]: ${data.note || 'Sin nota'}`,
      });
      await queryRunner.manager.save(movement);

      // 4. Actualizar Balance de Caja
      drawer.currentBalance = Number(drawer.currentBalance) - Number(data.amount);
      await queryRunner.manager.save(drawer);

      await queryRunner.commitTransaction();
      return savedExpense;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getExpenses(businessId: string, limit = 50): Promise<RetailExpense[]> {
    return this.expenseRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['drawer'],
    });
  }
}
