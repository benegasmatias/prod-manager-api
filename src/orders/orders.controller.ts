import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, FilterOrderDto, UpdateOrderDto } from './dto/order.dto';
import { OrderStatus } from '../common/enums';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    @Get()
    findAll(@Query() filters: FilterOrderDto) {
        return this.ordersService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: OrderStatus,
        @Body('notes') notes?: string,
    ) {
        return this.ordersService.updateStatus(id, status, notes);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        return this.ordersService.update(id, updateOrderDto);
    }
}
