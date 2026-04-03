import { Controller, Get, Post, Body, UseGuards, Request, Param, Patch, Query, BadRequestException } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessAccessGuard } from './guards/business-access.guard';
import { BusinessStatusGuard } from './guards/business-status.guard';
import { AllowBusinessStatuses } from './decorators/allow-business-statuses.decorator';
import { BusinessStatus } from '../common/enums';

@Controller('businesses')
@UseGuards(SupabaseAuthGuard)
export class BusinessesController {
    constructor(private readonly businessesService: BusinessesService) { }

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

    @Get('/:id')
    @UseGuards(BusinessAccessGuard)
    async findOne(@Request() req, @Param('id') id: string) {
        return this.businessesService.findOne(req.user.id, id);
    }

    @Get(':id/dashboard-summary')
    @UseGuards(BusinessAccessGuard, BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
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
    @UseGuards(BusinessAccessGuard)
    async getPlanUsage(@Param('id') id: string) {
        return this.businessesService.getBusinessUsage(id);
    }

    @Patch('admin/:id/status')
    @UseGuards(BusinessAccessGuard) // En el futuro será un GlobalRoleGuard(SUPER_ADMIN)
    async updateStatusAdmin(
        @Param('id') id: string,
        @Body() body: { status: string, reasonCode?: string, reasonText?: string }
    ) {
        return this.businessesService.updateStatusAdmin(id, body.status, body.reasonCode, body.reasonText);
    }

    @Post()
    async create(@Request() req, @Body() createDto: CreateBusinessFromTemplateDto) {
        return this.businessesService.createFromTemplate(req.user.id, createDto);
    }

    @Patch('/:id')
    @UseGuards(BusinessAccessGuard)
    async update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateBusinessDto) {
        return this.businessesService.update(req.user.id, id, updateDto);
    }

    @Patch('/:id/onboarding')
    @UseGuards(BusinessAccessGuard)
    async updateOnboarding(@Request() req, @Param('id') id: string, @Body('onboardingStep') step: string) {
        return this.businessesService.updateOnboardingStep(req.user.id, id, step);
    }

    @Post('/:id/activate')
    @UseGuards(BusinessAccessGuard)
    async activate(@Request() req, @Param('id') id: string) {
        return this.businessesService.activateBusiness(req.user.id, id);
    }
}
