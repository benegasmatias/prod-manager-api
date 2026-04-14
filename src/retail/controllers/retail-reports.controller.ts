import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../../businesses/guards/business-access.guard';
import { RetailReportsService } from '../services/retail-reports.service';

@Controller('retail/reports')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard)
export class RetailReportsController {
  constructor(private readonly reportsService: RetailReportsService) {}

  @Get(':businessId/daily-summary')
  async getDailySummary(@Param('businessId') businessId: string) {
    return this.reportsService.getDailySummary(businessId);
  }

  @Get(':businessId/top-products')
  async getTopProducts(
    @Param('businessId') businessId: string,
    @Query('limit') limit: number
  ) {
    return this.reportsService.getTopProducts(businessId, limit);
  }

  @Get(':businessId/low-stock')
  async getLowStock(
    @Param('businessId') businessId: string,
    @Query('threshold') threshold: number
  ) {
    return this.reportsService.getLowStock(businessId, threshold);
  }

  @Get(':businessId/movements')
  async getMovements(
    @Param('businessId') businessId: string,
    @Query('drawerId') drawerId?: string
  ) {
    return this.reportsService.getCashMovements(businessId, drawerId);
  }
}
