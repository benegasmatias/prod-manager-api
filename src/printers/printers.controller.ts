import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { PrintersService } from './printers.service';
import { PrinterStatus } from '../common/enums';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreatePrinterDto } from './dto/create-printer.dto';

@Controller('printers')
@UseGuards(SupabaseAuthGuard)
export class PrintersController {
    constructor(private readonly printersService: PrintersService) { }

    @Post()
    async create(@Body() createPrinterDto: CreatePrinterDto) {
        return this.printersService.create(createPrinterDto);
    }

    @Get()
    async findAll(@Query('businessId') businessId?: string) {
        return this.printersService.findAll(businessId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.printersService.findOne(id);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: PrinterStatus,
    ) {
        return this.printersService.updateStatus(id, status);
    }

    @Post(':id/assign-order')
    async assignOrder(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('orderId', ParseUUIDPipe) orderId: string,
    ) {
        return this.printersService.assignOrder(id, orderId);
    }

    @Post(':id/release')
    async release(@Param('id', ParseUUIDPipe) id: string) {
        return this.printersService.release(id);
    }
}
