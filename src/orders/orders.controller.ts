import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Query, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateProgressDto, FindOrdersDto, FindVisitsDto, FindQuotationsDto } from './dto/order.dto';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { BusinessStatus } from '../common/enums';

@Controller('orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get('summary')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async getSummary(@Query('businessId') businessId: string) {
        return this.ordersService.getSummaryStats(businessId);
    }

    @Get('budget-summary')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async getBudgetSummary(@Query('businessId') businessId: string) {
        return this.ordersService.getBudgetSummaryStats(businessId);
    }

    @Get('listing')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findListing(@Query() query: FindOrdersDto) {
        return this.ordersService.findListing(query);
    }

    @Get('visits')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findVisits(@Query() query: FindVisitsDto) {
        return this.ordersService.findVisits(query);
    }

    @Get('quotations')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findQuotations(@Query() query: FindQuotationsDto) {
        return this.ordersService.findQuotations(query);
    }

    @Get()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findAll(@Query() query: FindOrdersDto) {
        return this.ordersService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOne(id);
    }

    @Post()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
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
