import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateFileAssetDto } from './dto/file.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { BusinessRole } from '../common/enums';

@Controller('files')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
export class FilesController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    create(@Body() createFileAssetDto: CreateFileAssetDto) {
        return this.productsService.createFileAsset(createFileAssetDto);
    }
}
