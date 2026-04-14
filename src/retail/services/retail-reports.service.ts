import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { CashDrawer } from '../entities/cash-drawer.entity';
import { CashMovement } from '../entities/cash-movement.entity';
import { RetailProduct } from '../entities/retail-product.entity';
import { CashMovementType } from '../retail.enums';

@Injectable()
export class RetailReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(CashDrawer)
    private readonly drawerRepo: Repository<CashDrawer>,
    @InjectRepository(CashMovement)
    private readonly movementRepo: Repository<CashMovement>,
    @InjectRepository(RetailProduct)
    private readonly productRepo: Repository<RetailProduct>,
  ) {}

  async getDailySummary(businessId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Drawer Stats
    const latestDrawer = await this.drawerRepo.findOne({
      where: { businessId },
      order: { openedAt: 'DESC' },
    });

    const movements = latestDrawer 
      ? await this.movementRepo.find({ where: { drawerId: latestDrawer.id } })
      : [];

    const stats = {
      openingBalance: latestDrawer?.openingBalance || 0,
      totalSalesIncome: movements
        .filter(m => m.type === CashMovementType.SALE_INCOME)
        .reduce((sum, m) => sum + Number(m.amount), 0),
      manualIncome: movements
        .filter(m => m.type === CashMovementType.MANUAL_IN)
        .reduce((sum, m) => sum + Number(m.amount), 0),
      manualExpenses: movements
        .filter(m => m.type === CashMovementType.MANUAL_OUT)
        .reduce((sum, m) => sum + Number(m.amount), 0),
      currentBalance: latestDrawer?.currentBalance || 0,
      drawerStatus: latestDrawer?.status || 'CLOSED',
    };

    // 2. Sales Summary
    const salesToday = await this.saleRepo.find({
      where: { businessId, createdAt: Between(todayStart, todayEnd) }
    });

    const salesSummary = {
      totalAmount: salesToday.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      count: salesToday.length,
      averageTicket: salesToday.length > 0 
        ? salesToday.reduce((sum, s) => sum + Number(s.totalAmount), 0) / salesToday.length 
        : 0
    };

    return { drawer: stats, sales: salesSummary };
  }

  async getTopProducts(businessId: string, limit: number = 5) {
    return this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .select('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.totalAmount)', 'revenue')
      .innerJoin('item.sale', 'sale', 'sale.businessId = :businessId', { businessId })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('quantity', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getLowStock(businessId: string, threshold: number = 5) {
    return this.productRepo.find({
      where: { 
        businessId, 
        stock: Between(-99999, threshold) // Using negative to be safe if allows negative
      },
      order: { stock: 'ASC' }
    });
  }

  async getCashMovements(businessId: string, drawerId?: string) {
    let targetDrawerId = drawerId;
    
    if (!targetDrawerId) {
      const latest = await this.drawerRepo.findOne({
        where: { businessId },
        order: { openedAt: 'DESC' }
      });
      targetDrawerId = latest?.id;
    }

    if (!targetDrawerId) return [];

    return this.movementRepo.find({
      where: { drawerId: targetDrawerId },
      order: { createdAt: 'DESC' }
    });
  }
}
