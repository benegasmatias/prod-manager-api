import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query, Request, UseInterceptors } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateProgressDto, FindOrdersDto, FindVisitsDto, FindQuotationsDto } from './dto/order.dto';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { BusinessStatus, BusinessRole } from '../common/enums';
import { FinancialPrivacyInterceptor } from '../common/interceptors/financial-privacy.interceptor';

@Controller('orders')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
@UseInterceptors(FinancialPrivacyInterceptor)
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly auditService: AuditService
    ) { }

    @Get('summary')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async getSummary(@Query('businessId') businessId: string) {
        return this.ordersService.getSummaryStats(businessId);
    }

    @Get('workload')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async getWorkload(
        @Query('businessId') businessId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.ordersService.getWorkload(
            businessId, 
            startDate ? new Date(startDate) : undefined, 
            endDate ? new Date(endDate) : undefined
        );
    }

    @Get('budget-summary')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async getBudgetSummary(@Query('businessId') businessId: string) {
        return this.ordersService.getBudgetSummaryStats(businessId);
    }

    @Get('listing')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findListing(@Query() query: FindOrdersDto) {
        return this.ordersService.findListing(query);
    }

    @Get('visits')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findVisits(@Query() query: FindVisitsDto) {
        return this.ordersService.findVisits(query);
    }

    @Get('quotations')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findQuotations(@Query() query: FindQuotationsDto) {
        return this.ordersService.findQuotations(query);
    }

    @Get()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findAll(@Query() query: FindOrdersDto) {
        return this.ordersService.findAll(query);
    }

    @Get(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.ordersService.remove(id);
    }

    @Post()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
        const context = this.auditService.extractContext(req);
        return this.ordersService.create(createOrderDto, context);
    }

    @Post(':id/fail')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES, BusinessRole.OPERATOR)
    async reportFailure(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() reportFailureDto: import('./dto/order.dto').ReportFailureDto,
        @Request() req: any,
    ) {
        return this.ordersService.reportFailure(id, reportFailureDto, req.user.id);
    }

    @Post(':id/payments')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async addPayment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() createPaymentDto: CreatePaymentDto,
    ) {
        return this.ordersService.addPayment(id, createPaymentDto);
    }

    @Patch(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateOrderDto: UpdateOrderStatusDto,
        @Request() req: any,
    ) {
        return this.ordersService.update(id, updateOrderDto, req.user.id);
    }

    @Patch(':id/status')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES, BusinessRole.OPERATOR)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
        @Request() req: any,
    ) {
        return this.ordersService.updateStatus(id, updateStatusDto, req.user.id);
    }

    @Patch(':orderId/items/:itemId/status')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES, BusinessRole.OPERATOR)
    async updateItemStatus(
        @Param('orderId', ParseUUIDPipe) orderId: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() body: any,
        @Request() req: any,
    ) {
        return this.ordersService.updateItemStatus(orderId, itemId, body, req.user.id);
    }
}
