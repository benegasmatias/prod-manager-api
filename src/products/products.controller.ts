import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CatalogSeedService } from './catalog-seed.service';
import { CreateProductDto, UpdateProductDto, FindProductsDto } from './dto/product.dto';
import { CreateFileAssetDto, ProductFileDto } from './dto/file.dto';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from './dto/category.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { BusinessStatus, BusinessRole } from '../common/enums';

@Controller('products')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly seedService: CatalogSeedService
    ) { }

    @Post('categories/seed')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    seedCategories(@Body() body: { businessId: string, industry?: string, force?: boolean }) {
        return this.seedService.seedForBusiness(body.businessId, body.industry, body.force);
    }

    // --- Products ---

    @Post()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll(@Query() query: FindProductsDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.remove(id);
    }

    // --- Categories ---

    @Post('categories')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    createCategory(@Body() dto: CreateProductCategoryDto) {
        return this.productsService.createCategory(dto);
    }

    @Get('categories/all')
    findAllCategories(@Query('businessId') businessId: string) {
        return this.productsService.findAllCategories(businessId);
    }

    @Patch('categories/:id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductCategoryDto) {
        return this.productsService.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    removeCategory(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.removeCategory(id);
    }

    // --- Files ---

    @Post(':id/files')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    addFile(@Param('id', ParseUUIDPipe) id: string, @Body() productFileDto: ProductFileDto) {
        return this.productsService.addFileToProduct(id, productFileDto);
    }

    @Post('assets/files')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    createFileAsset(@Body() createFileAssetDto: CreateFileAssetDto) {
        return this.productsService.createFileAsset(createFileAssetDto);
    }
}
