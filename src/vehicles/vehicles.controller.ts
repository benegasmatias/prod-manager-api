import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';

@Controller('vehicles')
@UseGuards(BusinessAccessGuard)
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) {}

    @Post()
    create(@Query('businessId') businessId: string, @Body() data: any) {
        return this.vehiclesService.create(businessId, data);
    }

    @Get()
    findAll(@Query('businessId') businessId: string, @Query('customerId') customerId?: string) {
        return this.vehiclesService.findAll(businessId, customerId);
    }

    @Get(':id')
    findOne(@Query('businessId') businessId: string, @Param('id') id: string) {
        return this.vehiclesService.findOne(businessId, id);
    }

    @Patch(':id')
    update(@Query('businessId') businessId: string, @Param('id') id: string, @Body() data: any) {
        return this.vehiclesService.update(businessId, id, data);
    }
}
