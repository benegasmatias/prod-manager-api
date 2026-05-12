import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CatalogRequestService } from '../services/catalog-request.service';
import { SupabaseAuthGuard } from '../../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../../businesses/guards/business-access.guard';
import { CatalogRequestStatus } from '../../common/enums';

@Controller('catalog/requests')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard)
export class CatalogRequestAdminController {
  constructor(private readonly requestService: CatalogRequestService) {}

  @Get()
  async findAll(@Query('businessId') businessId: string) {
    return this.requestService.findAll(businessId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
  ) {
    return this.requestService.findOne(id, businessId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @Body('status') status: CatalogRequestStatus,
  ) {
    return this.requestService.updateStatus(id, businessId, status);
  }

  @Post(':id/convert')
  async convertToOrder(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @Request() req: any,
  ) {
    return this.requestService.convertToOrder(id, businessId, req.user.id);
  }
}
