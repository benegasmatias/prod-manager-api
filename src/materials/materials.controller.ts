import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { BusinessCapabilityGuard } from '../businesses/guards/business-capability.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { RequireCapability } from '../businesses/decorators/require-capability.decorator';
import { BusinessStatus, BusinessRole } from '../common/enums';

@Controller('materials')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard, BusinessCapabilityGuard)
@RequireCapability('INVENTORY_RAW')
export class MaterialsController {
    constructor(private readonly materialsService: MaterialsService) { }

    @Get('schema')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    getSchema(@Query('rubro') rubro: string, @Query('businessId') businessId: string) {
        return this.materialsService.getSchema(rubro);
    }

    @Post()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    create(@Body() createMaterialDto: CreateMaterialDto) {
        return this.materialsService.create(createMaterialDto);
    }

    @Get()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    findAll(@Query('businessId') businessId?: string) {
        return this.materialsService.findAll(businessId);
    }

    @Get(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findOne(@Param('id') id: string) {
        return this.materialsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
        return this.materialsService.update(id, updateMaterialDto);
    }

    @Delete(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async remove(@Param('id') id: string) {
        return this.materialsService.deactivate(id);
    }
}
