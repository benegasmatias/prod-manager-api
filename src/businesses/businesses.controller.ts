import { Controller, Get, Post, Body, UseGuards, Request, Param, Patch, Delete, Query, BadRequestException, UseInterceptors } from '@nestjs/common';
import { FinancialPrivacyInterceptor } from '../common/interceptors/financial-privacy.interceptor';
import { BusinessesService } from './businesses.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessAccessGuard } from './guards/business-access.guard';
import { BusinessStatusGuard } from './guards/business-status.guard';
import { BusinessRoleGuard } from './guards/business-role.guard';
import { AllowBusinessStatuses } from './decorators/allow-business-statuses.decorator';
import { RequireBusinessRole } from './decorators/require-business-role.decorator';
import { BusinessStatus, BusinessRole } from '../common/enums';

import { BusinessInvitationsService } from './business-invitations.service';

@Controller('businesses')
@UseGuards(SupabaseAuthGuard)
export class BusinessesController {
    constructor(
        private readonly businessesService: BusinessesService,
        private readonly invitationsService: BusinessInvitationsService
    ) { }

    @Get()
    async findAll(
        @Request() req,
        @Query('enabled') enabled?: string,
        @Query('accepting_orders') acceptingOrders?: string,
        @Query('status') status?: string
    ) {
        if (status && !Object.values(BusinessStatus).includes(status as BusinessStatus)) {
            throw new BadRequestException(`Estado inválido: ${status}. Permitidos: ${Object.values(BusinessStatus).join(', ')}`);
        }

        const filters = {
            isEnabled: enabled === undefined ? undefined : enabled === 'true',
            acceptingOrders: acceptingOrders === undefined ? undefined : acceptingOrders === 'true',
            status: status as BusinessStatus
        };
        return this.businessesService.findUserBusinesses(req.user.id, filters);
    }

    @Get(':id')
    @UseGuards(BusinessAccessGuard)
    async findOne(@Request() req, @Param('id') id: string) {
        return this.businessesService.findOne(req.user.id, id);
    }

    @Get(':id/dashboard-summary')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard, BusinessRoleGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @UseInterceptors(FinancialPrivacyInterceptor)
    async getSummary(@Request() req, @Param('id') id: string) {
        return this.businessesService.getDashboardSummary(req.user.id, id);
    }

    @Get(':id/config')
    @UseGuards(BusinessAccessGuard)
    async getConfig(@Request() req, @Param('id') id: string) {
        return this.businessesService.resolveBusinessConfig(req.user.id, id);
    }

    @Get('test-reload')
    async testReload() {
        return { message: "RELOAD_SUCCESS_OK_v1", time: new Date().toISOString() };
    }

    @Get('templates')
    async getTemplates(@Request() req) {
        return this.businessesService.getTemplates(req.user.id);
    }

    @Get(':id/plan-usage')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async getPlanUsage(@Param('id') id: string) {
        return this.businessesService.getBusinessUsage(id);
    }

    @Patch('admin/:id/status')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER)
    async updateStatusAdmin(
        @Param('id') id: string,
        @Body() body: { status: string, reasonCode?: string, reasonText?: string }
    ) {
        return this.businessesService.updateStatusAdmin(id, body.status, body.reasonCode, body.reasonText);
    }

    @Patch('admin/:id/enabled')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER)
    async updateEnabledAdmin(
        @Param('id') id: string,
        @Body() body: { isEnabled: boolean, reasonCode?: string, reasonText?: string }
    ) {
        return this.businessesService.updateEnabledAdmin(id, body.isEnabled, body.reasonCode, body.reasonText);
    }

    @Get(':id/audit-trace')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER)
    async getAuditTrace(@Param('id') id: string) {
        return this.businessesService.getBusinessAuditLogs(id);
    }

    @Post()
    async create(@Request() req, @Body() createDto: CreateBusinessFromTemplateDto) {
        return this.businessesService.createFromTemplate(req.user.id, createDto);
    }

    @Patch(':id')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateBusinessDto) {
        return this.businessesService.update(req.user.id, id, updateDto);
    }

    @Patch(':id/onboarding')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async updateOnboarding(@Request() req, @Param('id') id: string, @Body('onboardingStep') step: string) {
        return this.businessesService.updateOnboardingStep(req.user.id, id, step);
    }

    @Post(':id/activate')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async activate(@Request() req, @Param('id') id: string) {
        return this.businessesService.activateBusiness(req.user.id, id);
    }

    @Post(':id/invitations/check-email')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async checkEmail(
        @Param('id') id: string,
        @Body('email') email: string
    ) {
        if (!email) throw new BadRequestException('Email es requerido');
        return this.invitationsService.checkEmail(id, email);
    }

    @Post(':id/invitations')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async invite(
        @Param('id') id: string,
        @Request() req,
        @Body() body: { email: string, role?: string, firstName?: string, lastName?: string, phone?: string, specialty?: string }
    ) {
        // En V1, si no se envía rol, usamos OPERATOR por defecto
        const role = body.role || 'OPERATOR';
        
        const invitation = await this.invitationsService.createInvitation(id, body.email, role, req.user.id, {
            firstName: body.firstName,
            lastName: body.lastName,
            phone: body.phone,
            specialty: body.specialty
        });

        // SIMULACIÓN DE ENVÍO DE EMAIL
        console.log('\n================================================');
        console.log('📧 SIMULACIÓN DE EMAIL ENVIADO');
        console.log(`Para: ${body.email}`);
        console.log(`De: ${req.user.email} (Negocio ID: ${id})`);
        console.log(`Rol: ${role}`);
        console.log(`URL de Aceptación: http://localhost:4200/invitaciones/aceptar?token=${invitation.token}`);
        console.log('================================================\n');

        return invitation;
    }

    @Get(':id/invitations')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async getAllInvitations(@Param('id') id: string) {
        return this.invitationsService.getInvitations(id);
    }

    @Delete(':id')
    @UseGuards(BusinessAccessGuard, BusinessRoleGuard)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async remove(@Param('id') id: string) {
        return this.businessesService.delete(id);
    }
}
