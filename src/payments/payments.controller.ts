import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { BusinessStatus } from '../common/enums';

@Controller('orders/:id/payments')
@UseGuards(SupabaseAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    create(@Param('id') orderId: string, @Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.create(orderId, createPaymentDto);
    }

    @Get()
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    findAll(@Param('id') orderId: string) {
        return this.paymentsService.findByOrder(orderId);
    }
}
