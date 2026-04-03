import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { MachineStatus, BusinessStatus } from '../common/enums';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';

@Controller('machines')
@UseGuards(SupabaseAuthGuard)
export class MachinesController {
    constructor(private readonly printersService: MachinesService) { }

    @Post()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async create(@Body() createDto: CreateMachineDto) {
        return this.printersService.create(createDto);
    }

    @Get()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findAll(
        @Query('businessId') businessId?: string,
        @Query('onlyActive') onlyActive?: string,
        @Query('page') page: string = '1',
        @Query('pageSize') pageSize: string = '50',
    ) {
        const active = onlyActive === 'false' ? false : true;
        return this.printersService.findAll(businessId, active, Number(page), Number(pageSize));
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.findOne(id, businessId);
    }

    @Put(':id')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateMachineDto,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.update(id, updateDto, businessId);
    }

    @Patch(':id/status')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: MachineStatus,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.updateStatus(id, status, businessId);
    }

    @Post(':id/assign-order')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async assignOrder(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('orderId', ParseUUIDPipe) orderId: string,
        @Body('materialId') materialId?: string,
        @Body('metadata') metadata?: any,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.assignOrder(id, orderId, materialId, businessId, metadata);
    }

    @Post(':id/release')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async release(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.release(id, businessId);
    }

    @Delete(':id')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.deactivate(id, businessId);
    }
}
