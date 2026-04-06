import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { BusinessStatus, BusinessRole } from '../common/enums';

@Controller('orders/:id/payments')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
@RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    create(@Param('id') orderId: string, @Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.create(orderId, createPaymentDto);
    }

    @Get()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    findAll(@Param('id') orderId: string) {
        return this.paymentsService.findByOrder(orderId);
    }
}
