import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { PrintersService } from './printers.service';
import { PrinterStatus } from '../common/enums';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

@Controller('printers')
@UseGuards(SupabaseAuthGuard)
export class PrintersController {
    constructor(private readonly printersService: PrintersService) { }

    @Post()
    async create(@Body() createDto: CreatePrinterDto) {
        return this.printersService.create(createDto);
    }

    @Get()
    async findAll(
        @Query('businessId') businessId?: string,
        @Query('onlyActive') onlyActive?: string,
    ) {
        const active = onlyActive === 'false' ? false : true;
        return this.printersService.findAll(businessId, active);
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
        @Body() updateDto: UpdatePrinterDto,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.update(id, updateDto, businessId);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: PrinterStatus,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.updateStatus(id, status, businessId);
    }

    @Post(':id/assign-order')
    async assignOrder(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('orderId', ParseUUIDPipe) orderId: string,
        @Body('materialId') materialId?: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.assignOrder(id, orderId, materialId, businessId);
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
