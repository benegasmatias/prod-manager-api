import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards, Query, Delete } from '@nestjs/common';
import { CalibrationsService } from './calibrations.service';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { BusinessCapabilityGuard } from '../businesses/guards/business-capability.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { BusinessStatus } from '../common/enums';

@Controller('calibrations')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard, BusinessCapabilityGuard)
export class CalibrationsController {
    constructor(private readonly calibrationsService: CalibrationsService) {}

    @Post()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async create(
        @Body() createDto: CreateCalibrationDto,
        @Query('businessId') businessId: string,
    ) {
        return this.calibrationsService.create(createDto, businessId);
    }

    @Get()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findAll(
        @Query('businessId') businessId: string,
        @Query('machineId') machineId?: string,
        @Query('materialId') materialId?: string,
    ) {
        return this.calibrationsService.findAll(businessId, machineId, materialId);
    }

    @Get(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId: string,
    ) {
        return this.calibrationsService.findOne(id, businessId);
    }

    @Patch(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateCalibrationDto,
        @Query('businessId') businessId: string,
    ) {
        return this.calibrationsService.update(id, updateDto, businessId);
    }

    @Delete(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId: string,
    ) {
        return this.calibrationsService.remove(id, businessId);
    }
}
