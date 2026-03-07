import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Query, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateProgressDto, FindOrdersDto } from './dto/order.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';

@Controller('orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    async findAll(@Query() query: FindOrdersDto) {
        return this.ordersService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOne(id);
    }

    @Post()
    async create(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
        @Request() req: any,
    ) {
        return this.ordersService.updateStatus(id, updateStatusDto, req.user.id);
    }

    @Patch(':orderId/items/:itemId/progress')
    async updateProgress(
        @Param('orderId', ParseUUIDPipe) orderId: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() updateProgressDto: UpdateProgressDto,
        @Request() req: any,
    ) {
        return this.ordersService.updateProgress(orderId, itemId, updateProgressDto, req.user.id);
    }
}
