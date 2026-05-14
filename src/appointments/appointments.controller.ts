import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { BusinessStatus } from '../common/enums';

@Controller('appointments')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) {}

    @Post()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async create(@Request() req, @Query('businessId') businessId: string, @Body() createDto: CreateAppointmentDto) {
        return this.appointmentsService.create(req.user.id, businessId, createDto);
    }

    @Get()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findAll(@Request() req, @Query('businessId') businessId: string, @Query() query: any) {
        return this.appointmentsService.findAll(req.user.id, businessId, query);
    }

    @Get(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findOne(@Request() req, @Query('businessId') businessId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.appointmentsService.findOne(req.user.id, businessId, id);
    }

    @Patch(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async update(
        @Request() req,
        @Query('businessId') businessId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateAppointmentDto,
    ) {
        return this.appointmentsService.update(req.user.id, businessId, id, updateDto);
    }

    @Delete(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async remove(@Request() req, @Query('businessId') businessId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.appointmentsService.remove(req.user.id, businessId, id);
    }

    @Patch(':id/status')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async updateStatus(
        @Request() req,
        @Query('businessId') businessId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: any,
    ) {
        return this.appointmentsService.updateStatus(req.user.id, businessId, id, status);
    }
}
