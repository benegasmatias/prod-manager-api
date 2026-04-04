import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, UseGuards, Query, Request, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PlanUsageService } from './plan-usage.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from './guards/business-access.guard';
import { BusinessRoleGuard } from './guards/business-role.guard';
import { RequireBusinessRole } from './decorators/require-business-role.decorator';
import { BusinessRole } from '../common/enums';

@Controller('businesses/:id/subscription')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
export class BusinessSubscriptionController {
    constructor(
        private readonly billingService: BillingService,
        private readonly planUsageService: PlanUsageService
    ) { }

    @Get()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async getSubscription(@Param('id', ParseUUIDPipe) id: string) {
        // En esta fase, los detalles ya vienen en /config, pero este endpoint es para gestión pura
        return this.planUsageService.getBusinessUsage(id);
    }

    @Get('preflight')
    @RequireBusinessRole(BusinessRole.OWNER)
    async preflight(@Param('id', ParseUUIDPipe) id: string, @Query('plan') plan: string) {
        if (!plan) throw new BadRequestException('Se requiere plan para preflight');
        return this.billingService.preflightCheck(id, plan);
    }

    @Patch('plan')
    @RequireBusinessRole(BusinessRole.OWNER)
    async changePlan(
        @Param('id', ParseUUIDPipe) id: string, 
        @Body('plan') plan: string,
        @Request() req: any
    ) {
        if (!plan) throw new BadRequestException('Se requiere plan')
        return this.billingService.changePlan(id, plan, req.user.id);
    }

    // Endpoint de backup/utility para sincronizar
    @Post('sync')
    @RequireBusinessRole(BusinessRole.OWNER)
    async sync(@Param('id', ParseUUIDPipe) id: string) {
        // Obtenemos la suscripción y forzamos el sync del estado operativo
        const usage = await this.planUsageService.getBusinessUsage(id);
        const status = usage.status;
        await this.billingService.syncBusinessStatusFromSubscription(id, status);
        return { message: 'Sync OK', status };
    }
}
