import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Query, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateProgressDto, FindOrdersDto, FindVisitsDto, FindQuotationsDto } from './dto/order.dto';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';

@Controller('orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get('summary')
    async getSummary(@Query('businessId') businessId: string) {
        return this.ordersService.getSummaryStats(businessId);
    }

    @Get('budget-summary')
    async getBudgetSummary(@Query('businessId') businessId: string) {
        return this.ordersService.getBudgetSummaryStats(businessId);
    }

    @Get('listing')
    async findListing(@Query() query: FindOrdersDto) {
        return this.ordersService.findListing(query);
    }

    @Get('visits')
    async findVisits(@Query() query: FindVisitsDto) {
        return this.ordersService.findVisits(query);
    }

    @Get('quotations')
    async findQuotations(@Query() query: FindQuotationsDto) {
        return this.ordersService.findQuotations(query);
    }

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

    @Post(':id/fail')
    async reportFailure(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() reportFailureDto: import('./dto/order.dto').ReportFailureDto,
        @Request() req: any,
    ) {
        return this.ordersService.reportFailure(id, reportFailureDto, req.user.id);
    }

    @Post(':id/payments')
    async addPayment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() createPaymentDto: CreatePaymentDto,
    ) {
        return this.ordersService.addPayment(id, createPaymentDto);
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
