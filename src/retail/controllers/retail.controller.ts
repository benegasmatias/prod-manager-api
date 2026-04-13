import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessAccessGuard } from '../../businesses/guards/business-access.guard';
import { CashService } from '../services/cash.service';
import { RetailProductsService } from '../services/retail-products.service';
import { InventoryEngineService } from '../services/inventory-engine.service';
import { OpenDrawerDto, ManualMovementDto } from '../dto/cash.dto';
import { CreateRetailProductDto, UpdateRetailProductDto, StockAdjustmentDto } from '../dto/product.dto';

@Controller('retail')
@UseGuards(AuthGuard('jwt'), BusinessAccessGuard)
export class RetailController {
  constructor(
    private readonly cashService: CashService,
    private readonly productsService: RetailProductsService,
    private readonly inventoryEngine: InventoryEngineService,
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
}
