import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { MachineStatus } from '../common/enums';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Controller('machines')
@UseGuards(SupabaseAuthGuard)
export class MachinesController {
    constructor(private readonly printersService: MachinesService) { }

    @Post()
    async create(@Body() createDto: CreateMachineDto) {
        return this.printersService.create(createDto);
    }

    @Get()
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
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateMachineDto,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.update(id, updateDto, businessId);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: MachineStatus,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.updateStatus(id, status, businessId);
    }

    @Post(':id/assign-order')
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
    async release(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.release(id, businessId);
    }

    @Delete(':id')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.deactivate(id, businessId);
    }
}
