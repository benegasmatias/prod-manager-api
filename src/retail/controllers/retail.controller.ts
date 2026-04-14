import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../../businesses/guards/business-access.guard';
import { CashService } from '../services/cash.service';
import { RetailProductsService } from '../services/retail-products.service';
import { InventoryEngineService } from '../services/inventory-engine.service';
import { SalesService } from '../services/sales.service';
import { OpenDrawerDto, ManualMovementDto } from '../dto/cash.dto';
import { CreateRetailProductDto, UpdateRetailProductDto, StockAdjustmentDto } from '../dto/product.dto';
import { CreateSupplierDto, UpdateSupplierDto } from '../dto/supplier.dto';
import { RegisterPurchaseDto } from '../dto/purchase.dto';
import { ProcessSaleDto } from '../dto/sale.dto';
import { RetailSuppliersService } from '../services/retail-suppliers.service';
import { PurchasesService } from '../services/purchases.service';

@Controller('retail')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard)
export class RetailController {
  constructor(
    private readonly cashService: CashService,
    private readonly productsService: RetailProductsService,
    private readonly inventoryEngine: InventoryEngineService,
    private readonly salesService: SalesService,
    private readonly suppliersService: RetailSuppliersService,
    private readonly purchasesService: PurchasesService,
    private readonly expensesService: RetailExpensesService,
  ) {}

  @Get('drawer/current/:businessId')
  async getCurrent(@Param('businessId') businessId: string) {
    return this.cashService.getCurrentDrawer(businessId);
  }

  @Post('drawer/open/:businessId')
  async open(@Param('businessId') businessId: string, @Request() req, @Body() dto: OpenDrawerDto) {
    return this.cashService.openDrawer(businessId, req.user.id, dto);
  }

  @Post('drawer/movement/:businessId')
  async addMovement(@Param('businessId') businessId: string, @Request() req, @Body() dto: ManualMovementDto) {
    return this.cashService.addManualMovement(businessId, req.user.id, dto);
  }

  @Post('drawer/close/:businessId')
  async close(@Param('businessId') businessId: string) {
    return this.cashService.closeDrawer(businessId);
  }

  // --- PRODUCTS ---
  @Get('products/:businessId')
  async getProducts(@Param('businessId') businessId: string) {
    return this.productsService.findAll(businessId);
  }

  @Post('products/:businessId')
  async createProduct(@Param('businessId') businessId: string, @Body() dto: CreateRetailProductDto) {
    return this.productsService.create(businessId, dto);
  }

  @Post('products/:businessId/:id')
  async updateProduct(@Param('businessId') businessId: string, @Param('id') id: string, @Body() dto: UpdateRetailProductDto) {
    return this.productsService.update(businessId, id, dto);
  }

  // --- STOCK ---
  @Post('stock/adjust/:businessId/:productId')
  async adjustStock(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: StockAdjustmentDto
  ) {
    await this.productsService.findOne(businessId, productId);
    return this.inventoryEngine.adjustStock(productId, dto.amount, dto.type, dto.note);
  }

  // --- SALES ---
  @Get('sales/:businessId')
  async getSales(@Param('businessId') businessId: string) {
    return this.salesService.findAll(businessId);
  }

  @Post('sales/:businessId')
  async processSale(@Param('businessId') businessId: string, @Body() dto: ProcessSaleDto) {
    return this.salesService.processSale(businessId, dto);
  }

  // --- SUPPLIERS ---
  @Get('suppliers/:businessId')
  async getSuppliers(@Param('businessId') businessId: string) {
    return this.suppliersService.findAll(businessId);
  }

  @Post('suppliers/:businessId')
  async createSupplier(@Param('businessId') businessId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(businessId, dto);
  }

  @Post('suppliers/:businessId/:id')
  async updateSupplier(@Param('businessId') businessId: string, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(businessId, id, dto);
  }

  // --- PURCHASES ---
  @Get('purchases/:businessId')
  async getPurchases(@Param('businessId') businessId: string) {
    return this.purchasesService.findAll(businessId);
  }

  @Post('purchases/:businessId')
  async registerPurchase(@Param('businessId') businessId: string, @Body() dto: RegisterPurchaseDto, @Request() req: any) {
    return this.purchasesService.registerPurchase(businessId, dto, req.user.id);
  }

  // --- EXPENSES ---
  @Get('expenses/:businessId')
  async getExpenses(@Param('businessId') businessId: string) {
    return this.expensesService.getExpenses(businessId);
  }

  @Post('expenses/:businessId')
  async registerExpense(
    @Param('businessId') businessId: string, 
    @Body() dto: any, 
    @Request() req: any
  ) {
    return this.expensesService.registerExpense(businessId, req.user.id, dto);
  }
}
