import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PublicCatalogService } from '../services/public-catalog.service';
import { CreateCatalogOrderRequestDto } from '../dto/create-catalog-order-request.dto';

@Controller('public/catalog')
export class PublicCatalogController {
  constructor(private readonly publicCatalogService: PublicCatalogService) {}

  @Get(':businessSlug')
  async getCatalog(
    @Param('businessSlug') slug: string,
    @Query() query: { page?: number; limit?: number; categoryId?: string; search?: string }
  ) {
    return this.publicCatalogService.getCatalogData(slug, query);
  }

  @Post(':businessSlug/requests')
  async createRequest(
    @Param('businessSlug') slug: string,
    @Body() dto: CreateCatalogOrderRequestDto,
  ) {
    return this.publicCatalogService.createRequest(slug, dto);
  }
}
