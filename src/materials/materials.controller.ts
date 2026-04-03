import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { BusinessStatus } from '../common/enums';

@Controller('materials')
@UseGuards(SupabaseAuthGuard)
export class MaterialsController {
    constructor(private readonly materialsService: MaterialsService) { }

    @Post()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    create(@Body() createMaterialDto: CreateMaterialDto) {
        return this.materialsService.create(createMaterialDto);
    }

    @Get()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    findAll(@Query('businessId') businessId?: string) {
        return this.materialsService.findAll(businessId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.materialsService.findOne(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
        return this.materialsService.update(id, updateMaterialDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.materialsService.deactivate(id);
    }
}
